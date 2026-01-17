package com.drogaria.cotacao.utils;

public class TelefoneUtils {
    
    public static String formatarParaWhatsapp(String telefone) {
        if (telefone == null || telefone.isEmpty()) return "";
        
        // Remove tudo que não for número
        String limpo = telefone.replaceAll("\\D", "");
        
        // Se não tiver o código do país (55), adiciona (assumindo Brasil)
        if (!limpo.startsWith("55") && limpo.length() <= 11) {
            limpo = "55" + limpo;
        }
        
        return limpo;
    }
}