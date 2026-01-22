package com.drogaria.cotacao.service.excel;

import com.drogaria.cotacao.model.ItemCotacao;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExcelReaderService {

    public List<ItemCotacao> read(MultipartFile file) {
        String fileName = file.getOriginalFilename();

        if (fileName != null && fileName.toLowerCase().endsWith(".csv")) {
            return readCsv(file);
        } else {
            return readExcel(file);
        }
    }

    private List<ItemCotacao> readCsv(MultipartFile file) {
        List<ItemCotacao> itens = new ArrayList<>();

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.ISO_8859_1))) {
            
            String line;
            boolean primeiraLinha = true;

            while ((line = br.readLine()) != null) {
                if (primeiraLinha) {
                    primeiraLinha = false;
                    continue;
                }

                String[] colunas = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");

                if (colunas.length < 4)
                    continue;

                ItemCotacao item = new ItemCotacao();

                item.setNomeProduto(limparTextoCsv(colunas[0]));

                try {
                    String qtdStr = limparTextoCsv(colunas[2]).replaceAll("\\D", "");
                    item.setQuantidade(qtdStr.isEmpty() ? 0 : Integer.parseInt(qtdStr));
                } catch (Exception e) {
                    item.setQuantidade(0);
                }

                item.setUltimoPreco(lerPrecoCsv(colunas[3]));

                itens.add(item);
            }

        } catch (IOException e) {
            throw new RuntimeException("Falha ao ler arquivo CSV: " + e.getMessage());
        }

        return itens;
    }

    private String limparTextoCsv(String texto) {
        if (texto == null)
            return "";
        return texto.replace("\"", "").trim();
    }

    private Double lerPrecoCsv(String texto) {
        if (texto == null || texto.isEmpty())
            return 0.0;

        String limpo = texto.replace("\"", "").replace("R$", "").trim();

        try {
            return Double.parseDouble(limpo);
        } catch (NumberFormatException e) {
            try {
                return Double.parseDouble(limpo.replace(".", "").replace(",", "."));
            } catch (Exception ex) {
                return 0.0;
            }
        }
    }

    private List<ItemCotacao> readExcel(MultipartFile file) {
        List<ItemCotacao> itens = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                ItemCotacao item = new ItemCotacao();

                item.setNomeProduto(getCellValue(row.getCell(0)));

                try {
                    if (row.getCell(2).getCellType() == CellType.NUMERIC) {
                        item.setQuantidade((int) row.getCell(2).getNumericCellValue());
                    } else {
                        String qtdStr = getCellValue(row.getCell(2)).replaceAll("\\D", "");
                        item.setQuantidade(qtdStr.isEmpty() ? 0 : Integer.parseInt(qtdStr));
                    }
                } catch (Exception e) {
                    item.setQuantidade(0);
                }

                item.setUltimoPreco(lerPrecoExcel(row.getCell(3)));

                itens.add(item);
            }

        } catch (IOException e) {
            throw new RuntimeException("Falha ao ler arquivo Excel (.xlsx): " + e.getMessage());
        }

        return itens;
    }

    private String getCellValue(Cell cell) {
        if (cell == null)
            return "";
        if (cell.getCellType() == CellType.STRING)
            return cell.getStringCellValue();
        if (cell.getCellType() == CellType.NUMERIC)
            return String.valueOf(cell.getNumericCellValue());
        return "";
    }

    private Double lerPrecoExcel(Cell cell) {
        if (cell == null)
            return 0.0;

        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        }

        String texto = cell.getStringCellValue();
        if (texto == null || texto.isEmpty())
            return 0.0;
        String limpo = texto.replace("R$", "").replace(" ", "").trim();

        try {
            if (limpo.contains(",")) {
                limpo = limpo.replace(".", ""); 
                limpo = limpo.replace(",", "."); 
            }
            return Double.parseDouble(limpo);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}