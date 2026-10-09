package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.response.FotoConferenciaResponseDTO;
import com.drogaria.cotacao.model.FotoConferencia;
import com.drogaria.cotacao.model.ItemPedido;
import com.drogaria.cotacao.model.Pedido;
import com.drogaria.cotacao.repository.FotoConferenciaRepository;
import com.drogaria.cotacao.repository.ItemPedidoRepository;
import com.drogaria.cotacao.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FotoConferenciaService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    private final FotoConferenciaRepository fotoRepository;
    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;

    @Value("${app.storage.upload-dir:}")
    private String uploadDir;

    @Transactional
    public FotoConferenciaResponseDTO salvar(Long pedidoId, Long itemPedidoId, String ocorrencia,
                                              MultipartFile arquivo, String enviadoPor) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("A imagem enviada está vazia.");
        }
        if (arquivo.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Cada imagem deve ter no máximo 10 MB.");
        }
        if (!ALLOWED_TYPES.contains(arquivo.getContentType())) {
            throw new IllegalArgumentException("Formato de imagem não permitido. Use JPEG, PNG ou WebP.");
        }
        validarAssinatura(arquivo);

        Path raiz = resolverDiretorio();
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado."));
        ItemPedido item = null;
        if (itemPedidoId != null) {
            item = itemPedidoRepository.findById(itemPedidoId)
                    .orElseThrow(() -> new IllegalArgumentException("Item do pedido não encontrado."));
            if (!pedidoId.equals(item.getPedido().getId())) {
                throw new IllegalArgumentException("O item informado não pertence ao pedido.");
            }
        }

        String extensao = extensaoPorTipo(arquivo.getContentType());
        String nomeArmazenado = UUID.randomUUID() + extensao;
        Path diretorioPedido = raiz.resolve(String.valueOf(pedidoId)).normalize();
        Path destino = diretorioPedido.resolve(nomeArmazenado).normalize();
        if (!destino.startsWith(raiz)) {
            throw new IllegalArgumentException("Caminho de armazenamento inválido.");
        }

        try {
            Files.createDirectories(diretorioPedido);
            arquivo.transferTo(destino);
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível armazenar a imagem no servidor.", e);
        }

        FotoConferencia foto = new FotoConferencia();
        foto.setPedido(pedido);
        foto.setItemPedido(item);
        foto.setNomeOriginal(arquivo.getOriginalFilename() != null ? arquivo.getOriginalFilename() : "imagem");
        foto.setNomeArmazenado(nomeArmazenado);
        foto.setCaminhoArquivo(raiz.relativize(destino).toString());
        foto.setTipoConteudo(arquivo.getContentType());
        foto.setTamanhoBytes(arquivo.getSize());
        foto.setOcorrencia(ocorrencia);
        foto.setEnviadoPor(enviadoPor);
        foto.setDataCriacao(LocalDateTime.now());

        return toResponse(fotoRepository.save(foto));
    }

    @Transactional(readOnly = true)
    public List<FotoConferenciaResponseDTO> listar(Long pedidoId) {
        if (!pedidoRepository.existsById(pedidoId)) {
            throw new IllegalArgumentException("Pedido não encontrado.");
        }
        return fotoRepository.findByPedidoIdOrderByDataCriacaoAsc(pedidoId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Resource carregarArquivo(Long pedidoId, Long fotoId) {
        FotoConferencia foto = fotoRepository.findById(fotoId)
                .orElseThrow(() -> new IllegalArgumentException("Foto não encontrada."));
        if (!pedidoId.equals(foto.getPedido().getId())) {
            throw new IllegalArgumentException("A foto não pertence ao pedido.");
        }

        Path destino = resolverDiretorio().resolve(foto.getCaminhoArquivo()).normalize();
        if (!destino.startsWith(resolverDiretorio())) {
            throw new IllegalArgumentException("Caminho de arquivo inválido.");
        }
        try {
            Resource resource = new UrlResource(destino.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalArgumentException("Arquivo da foto não encontrado no servidor.");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new IllegalArgumentException("Arquivo da foto inválido.", e);
        }
    }

    @Transactional(readOnly = true)
    public String tipoConteudo(Long pedidoId, Long fotoId) {
        FotoConferencia foto = fotoRepository.findById(fotoId)
                .orElseThrow(() -> new IllegalArgumentException("Foto não encontrada."));
        if (!pedidoId.equals(foto.getPedido().getId())) {
            throw new IllegalArgumentException("A foto não pertence ao pedido.");
        }
        return foto.getTipoConteudo();
    }

    private Path resolverDiretorio() {
        if (uploadDir == null || uploadDir.isBlank()) {
            throw new IllegalStateException("O diretório persistente de uploads não foi configurado.");
        }
        Path raiz = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!raiz.isAbsolute()) {
            throw new IllegalStateException("O diretório persistente de uploads deve ser absoluto.");
        }
        return raiz;
    }

    private String extensaoPorTipo(String tipo) {
        return switch (tipo) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private void validarAssinatura(MultipartFile arquivo) {
        try (InputStream input = arquivo.getInputStream()) {
            byte[] cabecalho = input.readNBytes(12);
            boolean jpeg = cabecalho.length >= 3
                    && (cabecalho[0] & 0xff) == 0xff
                    && (cabecalho[1] & 0xff) == 0xd8
                    && (cabecalho[2] & 0xff) == 0xff;
            boolean png = cabecalho.length >= 8
                    && (cabecalho[0] & 0xff) == 0x89
                    && (cabecalho[1] & 0xff) == 0x50
                    && (cabecalho[2] & 0xff) == 0x4e
                    && (cabecalho[3] & 0xff) == 0x47;
            boolean webp = cabecalho.length >= 12
                    && cabecalho[0] == 'R' && cabecalho[1] == 'I'
                    && cabecalho[2] == 'F' && cabecalho[3] == 'F'
                    && cabecalho[8] == 'W' && cabecalho[9] == 'E'
                    && cabecalho[10] == 'B' && cabecalho[11] == 'P';
            if (!jpeg && !png && !webp) {
                throw new IllegalArgumentException("O conteúdo enviado não é uma imagem válida.");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Não foi possível validar a imagem enviada.", e);
        }
    }

    private FotoConferenciaResponseDTO toResponse(FotoConferencia foto) {
        return new FotoConferenciaResponseDTO(
                foto.getId(),
                foto.getItemPedido() != null ? foto.getItemPedido().getId() : null,
                foto.getNomeOriginal(),
                foto.getTipoConteudo(),
                foto.getTamanhoBytes(),
                foto.getOcorrencia(),
                foto.getEnviadoPor(),
                foto.getDataCriacao()
        );
    }
}
