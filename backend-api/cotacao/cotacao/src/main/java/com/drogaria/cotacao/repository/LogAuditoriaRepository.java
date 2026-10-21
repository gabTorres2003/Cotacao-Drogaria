package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.LogAuditoria;
import com.drogaria.cotacao.model.enums.TipoAcao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Long> {
    List<LogAuditoria> findByNomeUsuarioContainingIgnoreCase(String nomeUsuario);
    List<LogAuditoria> findByAcao(TipoAcao acao);
    List<LogAuditoria> findByDataHoraBetweenOrderByDataHoraDesc(LocalDateTime inicio, LocalDateTime fim);
    List<LogAuditoria> findTop100ByOrderByDataHoraDesc();
}