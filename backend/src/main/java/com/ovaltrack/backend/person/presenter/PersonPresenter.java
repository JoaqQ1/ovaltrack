package com.ovaltrack.backend.person.presenter;

import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.person.business.PersonService;
import com.ovaltrack.backend.person.domain.dto.PersonCreationDTO;
import com.ovaltrack.backend.person.domain.dto.PersonResponseDTO;
import com.ovaltrack.backend.person.domain.dto.PersonUpdateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("person")
@Tag(name = "Persons", description = "Create, query, update, and delete physical persons (players, coaches, staff)")
public class PersonPresenter {

    private final PersonService personService;

    public PersonPresenter(PersonService personService) {
        this.personService = personService;
    }

    @Operation(
        summary = "List all persons",
        description = "Returns every person registered in the system."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Persons returned successfully, even if there are none.")
    })
    @GetMapping
    public ResponseEntity<Object> findAllPersons() {
        return ResponseEntity.ok(personService.findAllPersons());
    }

    @Operation(
        summary = "Find a person by ID",
        description = "Returns the person identified by the personId path parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Person returned successfully."),
        @ApiResponse(responseCode = "404", description = "No person exists with the specified ID.")
    })
    @GetMapping("/{personId}")
    public ResponseEntity<Object> findPersonById(@PathVariable UUID personId) {
        PersonResponseDTO result = personService.findPersonById(personId);
        return (result != null) ? ResponseEntity.ok(result)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Persona no encontrada");
    }

    @Operation(
        summary = "Create a person",
        description = "Creates a new person from the request body and returns it.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Person data required for creation.",
            required = true,
            content = @io.swagger.v3.oas.annotations.media.Content(
                schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = PersonCreationDTO.class)
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Person created successfully."),
        @ApiResponse(responseCode = "409", description = "The request is invalid or the person cannot be saved because of a business or data-integrity conflict.")
    })
    @PostMapping
    public ResponseEntity<Object> savePerson(@Valid @RequestBody PersonCreationDTO request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError() != null ? bindingResult.getFieldError().getDefaultMessage() : "Datos inválidos";
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        try {
            return ResponseEntity.ok(personService.savePerson(request));
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar persona");
        }
    }

    @Operation(
        summary = "Update a person",
        description = "Updates the person identified by the personId path parameter.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Person data required for update.",
            required = true,
            content = @io.swagger.v3.oas.annotations.media.Content(
                schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = PersonUpdateDTO.class)
            )
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Person updated successfully."),
        @ApiResponse(responseCode = "409", description = "The person cannot be updated because of a business or data-integrity conflict.")
    })
    @PutMapping("/{personId}")
    public ResponseEntity<Object> updatePerson(@PathVariable UUID personId,
                                               @Valid @RequestBody PersonUpdateDTO request,
                                               BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String message = bindingResult.getFieldError() != null ? bindingResult.getFieldError().getDefaultMessage() : "Datos inválidos";
            return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
        }
        try {
            return ResponseEntity.ok(personService.updatePerson(personId, request));
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al actualizar persona");
        }
    }

    @Operation(
        summary = "Delete a person",
        description = "Deletes the person identified by the personId path parameter."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Person deleted successfully."),
        @ApiResponse(responseCode = "409", description = "The person cannot be deleted because of a business or data-integrity conflict.")
    })
    @DeleteMapping("/{personId}")
    public ResponseEntity<Object> deletePerson(@PathVariable UUID personId) {
        try {
            personService.deletePerson(personId);
            return ResponseEntity.ok("Persona eliminada correctamente");
        } catch (BusinessException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
        } catch (DataIntegrityViolationException anError) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al eliminar persona, hay entidades relacionadas");
        }
    }
}
