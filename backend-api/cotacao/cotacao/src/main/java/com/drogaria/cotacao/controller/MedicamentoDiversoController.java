package com.drogaria.cotacao.controller;

import com.drogaria.cotacao.model.MedicamentoDiverso;
import com.drogaria.cotacao.repository.MedicamentoDiversoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diversos")
public class MedicamentoDiversoController {

    @Autowired
    private MedicamentoDiversoRepository repository;

    @GetMapping
    public ResponseEntity<List<MedicamentoDiverso>> listarTodos() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<MedicamentoDiverso> buscarPorCodigo(@PathVariable String codigo) {
        return repository.findByCodigoDiversos(codigo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}