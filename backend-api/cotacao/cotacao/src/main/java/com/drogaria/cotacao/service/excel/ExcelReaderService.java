package com.drogaria.cotacao.service.excel;

import com.drogaria.cotacao.model.ItemCotacao;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExcelReaderService {

    public List<ItemCotacao> read(MultipartFile file) {
        List<ItemCotacao> itens = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                ItemCotacao item = new ItemCotacao();

                item.setNomeProduto(getCellValue(row.getCell(0)));

                try {
                    double qtd = row.getCell(2).getNumericCellValue();
                    item.setQuantidade((int) qtd);
                } catch (Exception e) {
                    String qtdStr = getCellValue(row.getCell(2)).replaceAll("\\D", "");
                    item.setQuantidade(qtdStr.isEmpty() ? 0 : Integer.parseInt(qtdStr));
                }

                item.setUltimoPreco(lerPreco(row.getCell(3)));

                itens.add(item);
            }

        } catch (IOException e) {
            throw new RuntimeException("Falha ao ler arquivo Excel: " + e.getMessage());
        }

        return itens;
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf(cell.getNumericCellValue());
        return "";
    }

    private Double lerPreco(Cell cell) {
        if (cell == null) return 0.0;

        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        }

        String texto = cell.getStringCellValue(); 
        if (texto == null || texto.isEmpty()) return 0.0;

        String limpo = texto.replace("R$", "").replace(" ", "").trim();
        limpo = limpo.replace(".", "");
        limpo = limpo.replace(",", ".");

        try {
            return Double.parseDouble(limpo);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}