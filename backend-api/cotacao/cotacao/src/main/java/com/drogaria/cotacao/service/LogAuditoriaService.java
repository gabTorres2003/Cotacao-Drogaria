package com.drogaria.cotacao.service;

import com.drogaria.cotacao.model.LogAuditoria;
import com.drogaria.cotacao.model.enums.TipoAcao;
import com.drogaria.cotacao.repository.LogAuditoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LogAuditoriaService {

    private final LogAuditoriaRepository logAuditoriaRepository;

    @Transactional
    public void registrarLog(String nomeUsuario, String tipoUsuario, TipoAcao acao, String entidadeAfetada, Long entidadeId, String detalhes) {
        LogAuditoria log = LogAuditoria.builder()
                .nomeUsuario(nomeUsuario)
                .tipoUsuario(tipoUsuario)
                .acao(acao)
                .entidadeAfetada(entidadeAfetada)
                .entidadeId(entidadeId)
                .detalhes(detalhes)
                .dataHora(LocalDateTime.now())
                .build();

        logAuditoriaRepository.save(log);
    }

    public List<LogAuditoria> listarUltimosLogs() {
        return logAuditoriaRepository.findTop100ByOrderByDataHoraDesc();
    }

    public List<LogAuditoria> buscarPorUsuario(String nomeUsuario) {
        return logAuditoriaRepository.findByNomeUsuarioContainingIgnoreCase(nomeUsuario);
    }

    public List<LogAuditoria> buscarPorAcao(TipoAcao acao) {
        return logAuditoriaRepository.findByAcao(acao);
    }

    public List<LogAuditoria> buscarPorPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        return logAuditoriaRepository.findByDataHoraBetweenOrderByDataHoraDesc(inicio, fim);
    }
}