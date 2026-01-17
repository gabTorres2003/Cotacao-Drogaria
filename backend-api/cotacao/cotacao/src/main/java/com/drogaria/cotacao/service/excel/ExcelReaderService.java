package com.drogaria.cotacao.service.excel;

import com.drogaria.cotacao.model.ItemCotacao;
import org.apache.poi.ss.usermodel.*; 
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

        try (InputStream inputStream = arquivo.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {

            // Pega a primeira aba
            Sheet sheet = workbook.getSheetAt(0);
            int totalLinhas = sheet.getPhysicalNumberOfRows(); // Conta linhas que têm dados físicos
            System.out.println("Aba selecionada: " + sheet.getSheetName());
            System.out.println("Linhas com dados físicos: " + totalLinhas);

            for (Row row : sheet) {
                int numeroLinha = row.getRowNum(); // Índice da linha 

                // Se a linha for menor que 4, pula (Cabeçalho)
                if (numeroLinha < 4) { 
                    System.out.println("Pulando cabeçalho linha " + (numeroLinha+1));
                    continue; 
                }

                // Extração dos dados
                String nomeProduto = getCellValue(row, 0); // Coluna A
                String qtdStr = getCellValue(row, 2);      // Coluna C
                String precoStr = getCellValue(row, 3);    // Coluna D

                // Se não tem nome, ignora
                if (nomeProduto.trim().isEmpty()) continue;

                System.out.println("Processando linha " + (numeroLinha+1) + ": " + nomeProduto);

                ItemCotacao item = new ItemCotacao();
                item.setNomeProduto(nomeProduto);

                try {
                    // Tratamento numérico robusto
                    if (!qtdStr.isEmpty()) {
                        double valorQtd = Double.parseDouble(qtdStr.replace(",", ".")); // Troca vírgula por ponto
                        item.setQuantidade((int) valorQtd);
                    }
                    if (!precoStr.isEmpty()) {
                         // Remove R$ ou espaços
                         String precoLimpo = precoStr.replace("R$", "").replace(" ", "").replace(",", ".");
                         item.setUltimoPreco(Double.parseDouble(precoLimpo));
                    }
                    listaDeItens.add(item);
                } catch (NumberFormatException e) {
                    System.out.println("Erro ao converter valores na linha " + (numeroLinha+1));
                }
            }
        }
        return listaDeItens;
    }

    private String getCellValue(Row row, int index) {
        Cell cell = row.getCell(index, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC: return String.valueOf(cell.getNumericCellValue());
            case FORMULA: 
                // Se for fórmula, tenta pegar o resultado numérico ou string
                try { return String.valueOf(cell.getNumericCellValue()); }
                catch (Exception e) { return cell.getStringCellValue(); }
            default: return "";
        }
    }
}