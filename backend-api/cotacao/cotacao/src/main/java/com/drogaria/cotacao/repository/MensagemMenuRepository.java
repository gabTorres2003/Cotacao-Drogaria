package com.drogaria.cotacao.repository;

import com.drogaria.cotacao.model.MensagemMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MensagemMenuRepository extends JpaRepository<MensagemMenu, Long> {

    @Query("""
            select m from MensagemMenu m
            where m.ativa = true
              and (m.dataPublicacao is null or m.dataPublicacao <= :agora)
              and (m.dataExpiracao is null or m.dataExpiracao > :agora)
            order by m.destaque desc, coalesce(m.dataPublicacao, m.dataCriacao) desc, m.id desc
            """)
    List<MensagemMenu> buscarVigentes(@Param("agora") LocalDateTime agora);

    List<MensagemMenu> findAllByOrderByDestaqueDescDataCriacaoDescIdDesc();
}
