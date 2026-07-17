package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.Usuario;
import com.drogaria.cotacao.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AutenticacaoService implements UserDetailsService {

    private final UsuarioRepository repository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = repository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPin())
                .authorities("ROLE_USER")
                .accountExpired(false)
                .accountLocked(!usuario.isAtivo())
                .credentialsExpired(false)
                .disabled(!usuario.isAtivo())
                .build();
    }
}