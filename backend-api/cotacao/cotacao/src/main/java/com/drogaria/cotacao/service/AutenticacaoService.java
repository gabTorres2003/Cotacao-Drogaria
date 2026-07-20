package com.drogaria.cotacao.service;

import com.drogaria.cotacao.repository.FornecedorRepository;
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

    private final UsuarioRepository usuarioRepository;
    private final FornecedorRepository fornecedorRepository; // Injetando o repositório de fornecedores

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        
        // 1. Tenta achar na tabela de usuários (Drogaria)
        var usuarioOpt = usuarioRepository.findByUsername(username);
        if (usuarioOpt.isPresent()) {
            var u = usuarioOpt.get();
            return User.builder()
                    .username(u.getUsername())
                    .password(u.getPin())
                    .authorities("ROLE_ADMIN") 
                    .disabled(!u.isAtivo())
                    .build();
        }

        // 2. Se não achou, tenta na tabela de fornecedores
        var fornecedorOpt = fornecedorRepository.findByLogin(username);
        if (fornecedorOpt.isPresent()) {
            var f = fornecedorOpt.get();
            
            // Garante que o Spring não quebre se a senha for nula no banco
            String senhaSegura = (f.getSenha() != null && !f.getSenha().trim().isEmpty()) 
                                 ? f.getSenha() 
                                 : "SENHA_NULA_PROIBIDA";
            
            return User.builder()
                    .username(f.getLogin())
                    .password(senhaSegura)
                    .authorities("ROLE_FORNECEDOR") 
                    .build();
        }

        // 3. Se não achou em nenhum, recusa o login
        throw new UsernameNotFoundException("Credenciais não encontradas no sistema.");
    }
}