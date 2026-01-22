package com.drogaria.cotacao.service.excel;

import com.drogaria.cotacao.model.ItemCotacao;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExcelReaderService {

    public List<ItemCotacao> read(MultipartFile file) {
        try {
            return readExcel(file);
        } catch (Exception e) {
            try {
                return readCsv(file);
            } catch (Exception csvEx) {
                throw new RuntimeException("Não foi possível ler o arquivo. Verifique o formato.");
            }
        }
    }

    private List<ItemCotacao> readCsv(MultipartFile file) throws Exception {
        List<ItemCotacao> itens = new ArrayList<>();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.ISO_8859_1))) {
            
            String line;
            boolean primeiraLinha = true;

            while ((line = br.readLine()) != null) {
                if (primeiraLinha) {
                    primeiraLinha = false;
                    continue; 
                }

                if (line.trim().isEmpty()) continue;

                String[] colunas = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");

                if (colunas.length < 4) continue;

                ItemCotacao item = new ItemCotacao();

                item.setNomeProduto(limparTexto(colunas[0]));

                try {
                    String qtdStr = limparTexto(colunas[2]).replaceAll("\\D", "");
                    item.setQuantidade(qtdStr.isEmpty() ? 0 : Integer.parseInt(qtdStr));
                } catch (Exception e) {
                    item.setQuantidade(0);
                }

                item.setUltimoPreco(lerPreco(colunas[3]));

                itens.add(item);
            }
        }
        return itens;
    }

    private List<ItemCotacao> readExcel(MultipartFile file) throws Exception {
        List<ItemCotacao> itens = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
            
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                ItemCotacao item = new ItemCotacao();

                item.setNomeProduto(getCellValue(row.getCell(0)));

                try {
                    String val = getCellValue(row.getCell(2));
                    if (row.getCell(2) != null && row.getCell(2).getCellType() == CellType.NUMERIC) {
                        item.setQuantidade((int) row.getCell(2).getNumericCellValue());
                    } else {
                        String qtdStr = val.replaceAll("\\D", "");
                        item.setQuantidade(qtdStr.isEmpty() ? 0 : Integer.parseInt(qtdStr));
                    }
                } catch (Exception e) {
                    item.setQuantidade(0);
                }

                item.setUltimoPreco(lerPrecoExcel(row.getCell(3)));
                itens.add(item);
            }
        }
        return itens;
    }

    private String limparTexto(String texto) {
        if (texto == null) return "";
        return texto.replace("\"", "").trim();
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf(cell.getNumericCellValue());
        return "";
    }

    private Double lerPreco(String texto) {
        if (texto == null || texto.isEmpty()) return 0.0;
        String limpo = texto.replace("\"", "").replace("R$", "").trim();
        
        try {
            return Double.parseDouble(limpo);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private Double lerPrecoExcel(Cell cell) {
        if (cell == null) return 0.0;
        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        }
        return lerPreco(cell.getStringCellValue());
    }
}