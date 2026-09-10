package com.ovaltrack.backend.event.presenter;

import java.util.Collection;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.ovaltrack.backend.club.business.ClubService;
import com.ovaltrack.backend.club.domain.Club;
import com.ovaltrack.backend.common.config.exceptions.BusinessException;
import com.ovaltrack.backend.division.business.DivisionService;
import com.ovaltrack.backend.division.domain.Division;
import com.ovaltrack.backend.event.business.EventService;
import com.ovaltrack.backend.event.domain.Event;
import com.ovaltrack.backend.match.business.MatchService;
import com.ovaltrack.backend.match.domain.Match;

import jakarta.validation.Valid;

// @RestController
// @RequestMapping("club")
// public class EventPresenter {

// @Autowired
// private EventService eventService;

// /*
// *
// /////////////////////////////////////////////////////////////////////////////
// * EVENT REQUESTS
// *
// /////////////////////////////////////////////////////////////////////////////
// */

// //TODO: Adapt Event services to use DTOs instead of JPA entities. Adapt
// endpoints

// @GetMapping("/{clubId}/events")
// public ResponseEntity<Object> findEventsByClubId(@PathVariable UUID clubId) {
// if (clubService.findClubById(clubId) == null ) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no
// encontrado");
// }

// Collection<Event> result = eventService.findEventsByClubId(clubId);
// return (!result.isEmpty()) ? ResponseEntity.ok(result)
// : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron eventos
// asociados al club");
// }

// @GetMapping("/{clubId}/division/{divisionId}/events")
// public ResponseEntity<Object> findEventsByDivisionId(@PathVariable UUID
// clubId, @PathVariable UUID divisionId) {
// if (clubService.findClubById(clubId) == null ) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no
// encontrado");
// }
// if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no
// encontrada");
// }

// Collection<Event> result = eventService.findEventsByDivisionId(divisionId);
// return (!result.isEmpty()) ? ResponseEntity.ok(result)
// : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron eventos
// asociados a la division");
// }

// @GetMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events")
// public ResponseEntity<Object> findEventsByMatchId(
// @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID
// matchId) {

// if (clubService.findClubById(clubId) == null ) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no
// encontrado");
// }
// if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no
// encontrada");
// }

// if (matchService.findMatchByIdAndDivisionId(matchId, divisionId) == null) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Partido no
// encontrado");
// }

// Collection<Event> result = eventService.findEventsByMatchId(matchId);
// return (!result.isEmpty()) ? ResponseEntity.ok(result)
// : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontraron eventos
// asociados al partido");
// }

// @GetMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events/{eventId}")
// public ResponseEntity<Object> findEventByIdAndMatchId(
// @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID
// matchId,
// @PathVariable UUID eventId) {
// if (clubService.findClubById(clubId) == null ) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no
// encontrado");
// }
// if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no
// encontrada");
// }
// if (matchService.findMatchByIdAndDivisionId(matchId, divisionId) == null) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Partido no
// encontrado");
// }

// Event result = eventService.findEventByIdAndMatchId(eventId, matchId);
// return (result != null) ? ResponseEntity.ok(result)
// : ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontro el evento
// asociado al partido");
// }

// @PostMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events")
// public ResponseEntity<Object> saveEvent(
// @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID
// matchId,
// @RequestBody Event event) {
// try {
// if (clubService.findClubById(clubId) == null ) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no
// encontrado");
// }
// if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no
// encontrada");
// }
// Match match = matchService.findMatchByIdAndDivisionId(matchId, divisionId);
// if (match == null) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Partido no
// encontrado");
// }
// return ResponseEntity.ok(eventService.saveEvent(match, event));
// } catch (BusinessException anError) {
// return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
// } catch (DataIntegrityViolationException anError) {
// return ResponseEntity.status(HttpStatus.CONFLICT).body("Error al guardar
// evento");
// }
// }

// // TODO: Soft delete, change it later
// @DeleteMapping("/{clubId}/division/{divisionId}/matches/{matchId}/events/{eventId}")
// public ResponseEntity<Object> deleteEvent(
// @PathVariable UUID clubId, @PathVariable UUID divisionId, @PathVariable UUID
// matchId,
// @PathVariable UUID eventId) {
// try {
// if (clubService.findClubById(clubId) == null ) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Club no
// encontrado");
// }
// if (divisionService.findDivisionByIdAndClubId(divisionId, clubId) == null) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Division no
// encontrada");
// }
// Match match = matchService.findMatchByIdAndDivisionId(matchId, divisionId);
// if (match == null) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Partido no
// encontrado");
// }
// eventService.deleteEvent(eventId, matchId);
// return ResponseEntity.ok("Evento eliminado correctamente");
// } catch (BusinessException anError) {
// return ResponseEntity.status(HttpStatus.CONFLICT).body(anError.getMessage());
// } catch (DataIntegrityViolationException anError) {
// return ResponseEntity.status(HttpStatus.CONFLICT)
// .body("Error al eliminar evento, hay entidades relacionadas");
// }
// }

// }
