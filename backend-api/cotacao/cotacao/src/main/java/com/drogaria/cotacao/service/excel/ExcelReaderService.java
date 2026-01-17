package com.drogaria.cotacao.service.excel;

import com.drogaria.cotacao.model.ItemCotacao;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExcelReaderService {

    public List<ItemCotacao> lerArquivoDeFaltas(MultipartFile arquivo) throws IOException {
        List<ItemCotacao> listaDeItens = new ArrayList<>();

        // 1. Abre o arquivo Excel que veio do upload
        try (InputStream inputStream = arquivo.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            // 2. Pega a primeira aba (Planilha1)
            Sheet sheet = workbook.getSheetAt(0);

            // 3. Itera sobre as linhas
            for (int i = 4; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);

                if (row == null) continue;

                // 4. Extrai os dados das células
                // Coluna A (índice 0) -> Produto
                // Coluna C (índice 2) -> Quantidade
                // Coluna D (índice 3) -> Último Preço

                String nomeProduto = getCellValue(row, 0); 
                String quantidadeStr = getCellValue(row, 2);
                String precoStr = getCellValue(row, 3);

                // Se não tiver nome do produto, ignora a linha
                if (nomeProduto.isEmpty()) continue;

                // 5. Cria o objeto e popula
                ItemCotacao item = new ItemCotacao();
                item.setNomeProduto(nomeProduto);
                
                // Converte String para números (tratando possíveis erros)
                try {
                    item.setQuantidade(Double.valueOf(quantidadeStr).intValue());
                    item.setUltimoPreco(Double.valueOf(precoStr));
                } catch (NumberFormatException e) {
                    // Se der erro na conversão, define 0 ou loga o erro
                    System.out.println("Erro ao converter número na linha " + (i+1));
                }

                listaDeItens.add(item);
            }
        }

        return listaDeItens;
    }

    // Método auxiliar para pegar o valor da célula como String
    private String getCellValue(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null) return "";

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf(cell.getNumericCellValue());
            default:
                return "";
        }
    }
}