package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.MensagemMenuRequestDTO;
import com.drogaria.cotacao.dto.response.MensagemMenuResponseDTO;
import com.drogaria.cotacao.model.MensagemMenu;
import com.drogaria.cotacao.model.enums.CategoriaMensagem;
import com.drogaria.cotacao.model.enums.TipoAcao;
import com.drogaria.cotacao.repository.MensagemMenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MensagemMenuService {

    private static final Set<String> PERFIS_VALIDOS = Set.of("ADM", "CONFERENTE", "FORNECEDOR");
    private static final int TITULO_MAX = 150;
    private static final int CONTEUDO_MAX = 5000;

    private final MensagemMenuRepository repository;
    private final LogAuditoriaService logAuditoriaService;

    @Transactional(readOnly = true)
    public List<MensagemMenuResponseDTO> listarVigentesParaPerfil(String perfil) {
        if (perfil == null || !PERFIS_VALIDOS.contains(perfil)) {
            return List.of();
        }

        return repository.buscarVigentes(LocalDateTime.now()).stream()
                .filter(mensagem -> destinatariosDe(mensagem).contains(perfil))
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MensagemMenuResponseDTO> listarTodas() {
        return repository.findAllByOrderByDestaqueDescDataCriacaoDescIdDesc().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MensagemMenuResponseDTO criar(MensagemMenuRequestDTO dto, String usuarioLogado) {
        MensagemMenu mensagem = new MensagemMenu();
        aplicarDadosValidados(mensagem, dto, true);
        MensagemMenu salva = repository.save(mensagem);

        logAuditoriaService.registrarLog(
                usuarioOuSistema(usuarioLogado), "INTERNO", TipoAcao.CRIACAO,
                "Mensagem de Menu", salva.getId(),
                "Cadastrou a mensagem de menu: " + salva.getTitulo()
        );

        return toResponseDTO(salva);
    }

    @Transactional
    public MensagemMenuResponseDTO atualizar(Long id, MensagemMenuRequestDTO dto, String usuarioLogado) {
        MensagemMenu mensagem = buscarEntidade(id);
        aplicarDadosValidados(mensagem, dto, false);
        MensagemMenu salva = repository.save(mensagem);

        logAuditoriaService.registrarLog(
                usuarioOuSistema(usuarioLogado), "INTERNO", TipoAcao.ATUALIZACAO,
                "Mensagem de Menu", salva.getId(),
                "Atualizou a mensagem de menu: " + salva.getTitulo()
        );

        return toResponseDTO(salva);
    }

    @Transactional
    public MensagemMenuResponseDTO alterarStatus(Long id, String usuarioLogado) {
        MensagemMenu mensagem = buscarEntidade(id);
        mensagem.setAtiva(!mensagem.isAtiva());
        MensagemMenu salva = repository.save(mensagem);

        logAuditoriaService.registrarLog(
                usuarioOuSistema(usuarioLogado), "INTERNO", TipoAcao.ATUALIZACAO,
                "Mensagem de Menu", salva.getId(),
                (salva.isAtiva() ? "Ativou" : "Desativou") + " a mensagem de menu: " + salva.getTitulo()
        );

        return toResponseDTO(salva);
    }

    @Transactional
    public void excluir(Long id, String usuarioLogado) {
        MensagemMenu mensagem = buscarEntidade(id);
        repository.delete(mensagem);

        logAuditoriaService.registrarLog(
                usuarioOuSistema(usuarioLogado), "INTERNO", TipoAcao.EXCLUSAO,
                "Mensagem de Menu", id,
                "Excluiu a mensagem de menu: " + mensagem.getTitulo()
        );
    }

    private MensagemMenu buscarEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensagem não encontrada."));
    }

    private void aplicarDadosValidados(MensagemMenu mensagem, MensagemMenuRequestDTO dto, boolean criacao) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados da mensagem não informados.");
        }

        String titulo = textoObrigatorio(dto.getTitulo(), "Informe o título da mensagem.", TITULO_MAX);
        String conteudo = textoObrigatorio(dto.getConteudo(), "Informe o conteúdo da mensagem.", CONTEUDO_MAX);
        CategoriaMensagem categoria = converterCategoria(dto.getCategoria());
        String destinatarios = normalizarDestinatarios(dto.getDestinatarios());

        LocalDateTime publicacao = dto.getDataPublicacao();
        LocalDateTime expiracao = dto.getDataExpiracao();
        if (publicacao != null && expiracao != null && !expiracao.isAfter(publicacao)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A data de expiração deve ser posterior à data de publicação."
            );
        }

        mensagem.setTitulo(titulo);
        mensagem.setConteudo(conteudo);
        mensagem.setCategoria(categoria);
        mensagem.setDestinatarios(destinatarios);
        mensagem.setDataPublicacao(publicacao);
        mensagem.setDataExpiracao(expiracao);

        if (criacao || dto.getAtiva() != null) {
            mensagem.setAtiva(dto.getAtiva() == null || dto.getAtiva());
        }
        if (criacao || dto.getDestaque() != null) {
            mensagem.setDestaque(dto.getDestaque() != null && dto.getDestaque());
        }
    }

    private String textoObrigatorio(String valor, String mensagemErro, int limite) {
        String texto = valor == null ? "" : valor.trim();
        if (texto.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensagemErro);
        }
        if (texto.length() > limite) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O campo deve ter no máximo " + limite + " caracteres."
            );
        }
        return texto;
    }

    private CategoriaMensagem converterCategoria(String categoria) {
        if (categoria == null || categoria.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a categoria da mensagem.");
        }
        try {
            return CategoriaMensagem.valueOf(categoria.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria de mensagem inválida.");
        }
    }

    private String normalizarDestinatarios(List<String> destinatarios) {
        if (destinatarios == null || destinatarios.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione ao menos um destinatário.");
        }

        LinkedHashSet<String> normalizados = new LinkedHashSet<>();
        for (String destinatario : destinatarios) {
            if (destinatario == null || destinatario.isBlank()) continue;
            String perfil = destinatario.trim().toUpperCase(Locale.ROOT);
            if ("ADMIN".equals(perfil)) perfil = "ADM";
            if (!PERFIS_VALIDOS.contains(perfil)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Destinatário inválido: " + destinatario);
            }
            normalizados.add(perfil);
        }

        if (normalizados.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione ao menos um destinatário.");
        }
        return String.join(",", normalizados);
    }

    private List<String> destinatariosDe(MensagemMenu mensagem) {
        if (mensagem.getDestinatarios() == null || mensagem.getDestinatarios().isBlank()) {
            return List.of();
        }
        return Arrays.stream(mensagem.getDestinatarios().split(","))
                .map(String::trim)
                .filter(valor -> !valor.isEmpty())
                .collect(Collectors.toList());
    }

    private MensagemMenuResponseDTO toResponseDTO(MensagemMenu mensagem) {
        return MensagemMenuResponseDTO.builder()
                .id(mensagem.getId())
                .titulo(mensagem.getTitulo())
                .conteudo(mensagem.getConteudo())
                .categoria(mensagem.getCategoria() != null ? mensagem.getCategoria().name() : null)
                .destinatarios(destinatariosDe(mensagem))
                .ativa(mensagem.isAtiva())
                .destaque(mensagem.isDestaque())
                .dataPublicacao(mensagem.getDataPublicacao())
                .dataExpiracao(mensagem.getDataExpiracao())
                .dataCriacao(mensagem.getDataCriacao())
                .dataAtualizacao(mensagem.getDataAtualizacao())
                .build();
    }

    private String usuarioOuSistema(String usuario) {
        return usuario == null || usuario.isBlank() ? "Sistema" : usuario;
    }
}
