package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.Encomenda;
import com.drogaria.cotacao.repository.EncomendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/encomendas")
public class EncomendaController {

    @Autowired
    private EncomendaRepository encomendaRepository;

    @GetMapping("/pendentes")
    public ResponseEntity<List<Encomenda>> listarPendentes() {
        return ResponseEntity.ok(encomendaRepository.findByCompradoFalseOrCompradoIsNull());
    }
}