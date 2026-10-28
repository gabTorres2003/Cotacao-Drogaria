package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.response.ProdutoConsultaBalcaoDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsultaDnaBalcaoServiceTest {

    @Mock
    private NamedParameterJdbcTemplate dnaNamedJdbcTemplate;

    @InjectMocks
    private ConsultaDnaBalcaoService service;

    @Test
    void retornaProdutoEncontradoComOrigemDna() {
        ProdutoConsultaBalcaoDTO produto = new ProdutoConsultaBalcaoDTO(
                100460, "7891234567890", "DIPIRONA 500MG", "N", "DNA");

        when(dnaNamedJdbcTemplate.query(anyString(), any(MapSqlParameterSource.class),
                any(RowMapper.class))).thenReturn(List.of(produto));

        Optional<ProdutoConsultaBalcaoDTO> resultado = service.consultarProduto("100460");

        assertThat(resultado).contains(produto);
        assertThat(resultado.get().origem()).isEqualTo("DNA");
    }

    @Test
    void retornaVazioQuandoNaoEncontrado() {
        when(dnaNamedJdbcTemplate.query(anyString(), any(MapSqlParameterSource.class),
                any(RowMapper.class))).thenReturn(List.of());

        assertThat(service.consultarProduto("999999999")).isEmpty();
    }

    @Test
    void naoConsultaDnaComTermoVazio() {
        assertThat(service.consultarProduto("   ")).isEmpty();

        verify(dnaNamedJdbcTemplate, never()).query(anyString(), any(MapSqlParameterSource.class),
                any(RowMapper.class));
    }

    @Test
    void sinalizaIndisponibilidadeQuandoDnaFalha() {
        when(dnaNamedJdbcTemplate.query(anyString(), any(MapSqlParameterSource.class),
                any(RowMapper.class))).thenThrow(new IllegalStateException("conexão recusada"));

        assertThatThrownBy(() -> service.consultarProduto("100460"))
                .isInstanceOf(ConsultaDnaBalcaoService.DnaIndisponivelException.class)
                .hasMessageContaining("DNA indisponível");
    }
}
