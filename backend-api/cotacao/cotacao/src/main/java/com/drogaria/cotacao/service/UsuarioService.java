package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.UsuarioRequestDTO;
import com.drogaria.cotacao.dto.response.UsuarioResponseDTO;
import com.drogaria.cotacao.model.Usuario;
import com.drogaria.cotacao.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;

    public List<UsuarioResponseDTO> listarTodos() {
        return repository.findAll().stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    public UsuarioResponseDTO criarUsuario(UsuarioRequestDTO dto) {
        Usuario usuario = new Usuario();
        usuario.setUsername(dto.getUsername());
        usuario.setNome(dto.getNome());
        usuario.setPin(dto.getPin()); 
        usuario.setAtivo(true);
        
        return toResponseDTO(repository.save(usuario));
    }

    public UsuarioResponseDTO atualizarUsuario(Long id, UsuarioRequestDTO dto) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        usuario.setUsername(dto.getUsername());
        usuario.setNome(dto.getNome());
        
        if (dto.getPin() != null && !dto.getPin().isBlank()) {
            usuario.setPin(dto.getPin());
        }

        return toResponseDTO(repository.save(usuario));
    }

    public void alterarStatus(Long id) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
        
        usuario.setAtivo(!usuario.isAtivo());
        repository.save(usuario);
    }

    private UsuarioResponseDTO toResponseDTO(Usuario usuario) {
        UsuarioResponseDTO dto = new UsuarioResponseDTO();
        dto.setId(usuario.getId());
        dto.setUsername(usuario.getUsername());
        dto.setNome(usuario.getNome());
        dto.setAtivo(usuario.isAtivo());
        return dto;
    }

    public void alterarPin(String username, String novoPin) {
        Usuario usuario = repository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
        
        usuario.setPin(novoPin);
        usuario.setPrimeiroAcesso(false);
        repository.save(usuario);
    }
}