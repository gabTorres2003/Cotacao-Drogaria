package com.drogaria.cotacao.service;

import com.drogaria.cotacao.dto.response.ProdutoPesquisaDnaDTO;
import com.drogaria.cotacao.dto.response.ResultadoPesquisaProdutosDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PesquisaProdutoDnaServiceTest {

    @Mock
    private NamedParameterJdbcTemplate dnaNamedJdbcTemplate;

    @InjectMocks
    private PesquisaProdutoDnaService service;

    private static ProdutoPesquisaDnaDTO produto(String descricao) {
        return new ProdutoPesquisaDnaDTO(
                100460, "7891234567890", descricao, "DIPIRONA", "COMPRIMIDO",
                "CX", "FABRICANTE X", "N", "DNA");
    }

    @Test
    void normalizaMaiusculasAcentosEEspacosExtras() {
        assertThat(PesquisaProdutoDnaService.normalizarTexto("  Ácido   Acetilsalicílico  "))
                .isEqualTo("ACIDO ACETILSALICILICO");
        assertThat(PesquisaProdutoDnaService.normalizarTexto("dipirona  sódica"))
                .isEqualTo("DIPIRONA SODICA");
    }

    @Test
    void aceitaVariacoesDoTipoDePesquisa() {
        assertThat(PesquisaProdutoDnaService.normalizarTipo("princípio ativo")).isEqualTo("PRINCIPIO");
        assertThat(PesquisaProdutoDnaService.normalizarTipo("PRINCIPIO_ATIVO")).isEqualTo("PRINCIPIO");
        assertThat(PesquisaProdutoDnaService.normalizarTipo("descrição")).isEqualTo("DESCRICAO");
        assertThat(PesquisaProdutoDnaService.normalizarTipo(null)).isEqualTo("DESCRICAO");
    }

    @Test
    void rejeitaTipoDesconhecido() {
        assertThatThrownBy(() -> PesquisaProdutoDnaService.normalizarTipo("fabricante"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void pesquisaDescricaoComParametrosNormalizados() {
        when(dnaNamedJdbcTemplate.query(anyString(), any(MapSqlParameterSource.class),
                any(RowMapper.class))).thenReturn(List.of(produto("DIPIRONA 500MG")));

        ResultadoPesquisaProdutosDTO resultado = service.pesquisar("  Dipirona  ", "descricao");

        assertThat(resultado.resultados()).hasSize(1);
        assertThat(resultado.truncado()).isFalse();
        assertThat(resultado.limite()).isEqualTo(ResultadoPesquisaProdutosDTO.LIMITE_PADRAO);

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<MapSqlParameterSource> paramsCaptor =
                ArgumentCaptor.forClass(MapSqlParameterSource.class);

        verify(dnaNamedJdbcTemplate).query(sqlCaptor.capture(), paramsCaptor.capture(),
                any(RowMapper.class));

        assertThat(sqlCaptor.getValue())
                .contains("UPPER(P.DESCRICAO)")
                .contains("FARPRINCIPIOATIVO")
                .contains("ORDER BY")
                .contains("SELECT FIRST " + (ResultadoPesquisaProdutosDTO.LIMITE_PADRAO + 1));

        MapSqlParameterSource params = paramsCaptor.getValue();
        assertThat(params.getValue("exato")).isEqualTo("DIPIRONA");
        assertThat(params.getValue("prefixo")).isEqualTo("DIPIRONA");
        assertThat(params.getValue("palavra")).isEqualTo("% DIPIRONA%");
        assertThat(params.getValue("contem")).isEqualTo("%DIPIRONA%");
    }

    @Test
    void pesquisaPrincipioAtivoNaColunaCorreta() {
        when(dnaNamedJdbcTemplate.query(anyString(), any(MapSqlParameterSource.class),
                any(RowMapper.class))).thenReturn(List.of(produto("DIPIRONA 500MG")));

        service.pesquisar("dipirona", "principio");

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        verify(dnaNamedJdbcTemplate).query(sqlCaptor.capture(), any(MapSqlParameterSource.class),
                any(RowMapper.class));

        assertThat(sqlCaptor.getValue()).contains("UPPER(P.FARPRINCIPIOATIVO)");
    }

    @Test
    void truncaListaQuandoExcedeOLimite() {
        List<ProdutoPesquisaDnaDTO> muitos = new ArrayList<>();
        for (int i = 0; i <= ResultadoPesquisaProdutosDTO.LIMITE_PADRAO; i++) {
            muitos.add(produto("DIPIRONA " + i));
        }

        when(dnaNamedJdbcTemplate.query(anyString(), any(MapSqlParameterSource.class),
                any(RowMapper.class))).thenReturn(muitos);

        ResultadoPesquisaProdutosDTO resultado = service.pesquisar("dipirona", "descricao");

        assertThat(resultado.resultados()).hasSize(ResultadoPesquisaProdutosDTO.LIMITE_PADRAO);
        assertThat(resultado.truncado()).isTrue();
    }

    @Test
    void escapaCuringasDoLike() {
        when(dnaNamedJdbcTemplate.query(anyString(), any(MapSqlParameterSource.class),
                any(RowMapper.class))).thenReturn(List.of());

        service.pesquisar("50%", "descricao");

        ArgumentCaptor<MapSqlParameterSource> paramsCaptor =
                ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(dnaNamedJdbcTemplate).query(anyString(), paramsCaptor.capture(),
                any(RowMapper.class));

        assertThat(paramsCaptor.getValue().getValue("contem")).isEqualTo("%50\\%%");
    }

    @Test
    void naoConsultaDnaComTermoCurto() {
        assertThatThrownBy(() -> service.pesquisar(" d ", "descricao"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("pelo menos");

        verify(dnaNamedJdbcTemplate, never()).query(anyString(), any(MapSqlParameterSource.class),
                any(RowMapper.class));
    }

    @Test
    void rejeitaTermoMuitoLongo() {
        String termo = "a".repeat(PesquisaProdutoDnaService.TAMANHO_MAXIMO_TERMO + 1);

        assertThatThrownBy(() -> service.pesquisar(termo, "descricao"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no máximo");
    }

    @Test
    void sinalizaIndisponibilidadeQuandoDnaFalha() {
        when(dnaNamedJdbcTemplate.query(anyString(), any(MapSqlParameterSource.class),
                any(RowMapper.class))).thenThrow(new IllegalStateException("conexão recusada"));

        assertThatThrownBy(() -> service.pesquisar("dipirona", "descricao"))
                .isInstanceOf(PesquisaProdutoDnaService.DnaIndisponivelException.class)
                .hasMessageContaining("DNA indisponível");
    }
}
