package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.request.UsuarioRequestDTO;
import com.drogaria.cotacao.dto.response.UsuarioResponseDTO;
import com.drogaria.cotacao.model.Usuario;
import com.drogaria.cotacao.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    public List<UsuarioResponseDTO> listarTodos() {
        return repository.findAll().stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    public UsuarioResponseDTO criarUsuario(UsuarioRequestDTO dto) {
        Usuario usuario = new Usuario();
        usuario.setUsername(dto.getUsername());
        usuario.setNome(dto.getNome());
        usuario.setPin(passwordEncoder.encode(dto.getPin())); 
        usuario.setAtivo(true);
        
        Usuario salvo = repository.save(usuario);
        return toResponseDTO(salvo);
    }

    private UsuarioResponseDTO toResponseDTO(Usuario usuario) {
        UsuarioResponseDTO dto = new UsuarioResponseDTO();
        dto.setId(usuario.getId());
        dto.setUsername(usuario.getUsername());
        dto.setNome(usuario.getNome());
        dto.setAtivo(usuario.isAtivo());
        return dto;
    }
}