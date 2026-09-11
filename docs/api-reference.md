# OvalTrack API Reference

This document describes the endpoints exposed by the Club, Division, DivisionPlayer, DivisionCoach, and Match presenters. It reflects the current controller annotations and DTO definitions.

Base URL: `/api` when the application is configured with the API prefix.

All UUID values use the standard UUID string format. `LocalDateTime` values use ISO-8601 date-time format, for example `2026-09-09T18:30:00`.

## Important Swagger note

The controllers currently return `ResponseEntity<Object>`. Swagger will therefore infer many successful and error response bodies as generic objects unless explicit response schemas are added with `@ApiResponse(content = ...)`. The response shapes below describe the DTOs and literal messages returned by the current implementation.

## Clubs

Tag: `Clubs`  
Controller path: `/club`

### `GET /club`

Lists all clubs in the system. The result can be empty.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Clubs returned successfully. | Array of `ClubResponseDTO` |

### `GET /club/{clubId}`

Returns one club by its ID.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Club found. | `ClubResponseDTO` |
| `404 Not Found` | The ID does not belong to a club. | Text: `Club no encontrado` |

Path parameter: `clubId` (`UUID`)

### `POST /club`

Creates a club and returns it.

Request body: `ClubCreationDTO` (required)

```json
{
  "name": "OvalTrack Club",
  "adminUserId": "00000000-0000-0000-0000-000000000001",
  "city": "Montevideo",
  "logoUrl": "https://example.com/logo.png",
  "contactEmail": "club@example.com",
  "contactPhone": "+59800000000"
}
```

Required fields: `name`, `adminUserId`.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Club created successfully. | `ClubResponseDTO` |
| `409 Conflict` | Invalid data, business error, or data-integrity conflict. | Error message text |

### `PUT /club/{clubId}`

Updates an existing club and returns it.

Path parameter: `clubId` (`UUID`)

Request body: `ClubUpdateDTO` (required)

```json
{
  "name": "Updated Club Name",
  "city": "Montevideo",
  "logoUrl": "https://example.com/new-logo.png",
  "contactEmail": "updated@example.com",
  "contactPhone": "+59800000000"
}
```

Required field: `name`.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Club updated successfully. | `ClubResponseDTO` |
| `409 Conflict` | Invalid data, business error, or data-integrity conflict. | Error message text |

### `DELETE /club/{clubId}`

Deletes the club identified by the UUID.

Path parameter: `clubId` (`UUID`)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Club deleted successfully. | Text: `Club eliminado correctamente` |
| `409 Conflict` | The club cannot be deleted because of a business or data-integrity conflict. | Error message text |

## Divisions

Tag: `Divisions`  
Controller path: `/division`

### `GET /division?clubId={clubId}`

Lists all divisions associated with a club. The result can be empty.

Query parameter: `clubId` (`UUID`, required)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Divisions returned successfully. | Array of `DivisionResponseDTO` |
| `409 Conflict` | The club does not exist or the request caused a business conflict. | Error message text |

### `GET /division/{divisionId}`

Returns one division by its ID.

Path parameter: `divisionId` (`UUID`)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Division found. | `DivisionResponseDTO` |
| `404 Not Found` | No division exists with the specified ID. | Text: `Division no encontrada` |

### `POST /division`

Creates a division and returns it.

Request body: `DivisionCreationDTO` (required)

```json
{
  "clubId": "00000000-0000-0000-0000-000000000001",
  "name": "Senior A",
  "ageCategory": "SENIOR",
  "gender": "MIXED"
}
```

Required fields: `clubId`, `name`, `ageCategory`, `gender`.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Division created successfully. | `DivisionResponseDTO` |
| `409 Conflict` | Invalid data, business error, or data-integrity conflict. | Error message text |

### `PUT /division/{divisionId}`

Updates a division and returns it.

Path parameter: `divisionId` (`UUID`)

Request body: `DivisionUpdateDTO` (required)

```json
{
  "name": "Senior A Updated",
  "ageCategory": "SENIOR",
  "gender": "MIXED"
}
```

Required fields: `name`, `ageCategory`, `gender`.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Division updated successfully. | `DivisionResponseDTO` |
| `409 Conflict` | Invalid data, business error, or data-integrity conflict. | Error message text |

### `DELETE /division/{divisionId}`

Disables the division identified by the UUID.

Path parameter: `divisionId` (`UUID`)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Division disabled successfully. | Text: `Division eliminada correctamente` |
| `409 Conflict` | The division cannot be disabled because of a business conflict or data-integrity issue. | Error message text |

## Division players

Tag: `Division players`  
Controller path: `/players`

### `GET /players?divisionId={divisionId}`

Lists all players associated with a division. The result can be empty.

Query parameter: `divisionId` (`UUID`, required)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Division players returned successfully. | Array of `DivisionPlayerResponseDTO` |
| `409 Conflict` | The division or request caused a business conflict. | Error message text |

### `GET /players/{divisionPlayerId}`

Returns one division-player association by its ID.

Path parameter: `divisionPlayerId` (`UUID`)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Association found. | `DivisionPlayerResponseDTO` |
| `404 Not Found` | No player association exists with the specified ID. | Text: `No se encontro al jugador asociado a la division` |

### `POST /players`

Registers a player in a division and returns the association.

Request body: `DivisionPlayerCreationDTO` (required)

```json
{
  "divisionId": "00000000-0000-0000-0000-000000000001",
  "userId": "00000000-0000-0000-0000-000000000002",
  "jerseyNumber": 10,
  "position": "Forward"
}
```

Required fields: `divisionId`, `userId`.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Player registered successfully. | `DivisionPlayerResponseDTO` |
| `409 Conflict` | Business or data-integrity conflict. | Error message text |

### `PUT /players/{divisionPlayerId}`

Updates a division-player association.

Path parameter: `divisionPlayerId` (`UUID`)

Request body: `DivisionPlayerUpdateDTO` (required)

```json
{
  "jerseyNumber": 10,
  "position": "Midfielder"
}
```

Both fields are optional according to the DTO validation annotations.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Association updated successfully. | `DivisionPlayerResponseDTO` |
| `409 Conflict` | Business or data-integrity conflict. | Error message text |

### `DELETE /players/{divisionPlayerId}`

Removes a player from a division.

Path parameter: `divisionPlayerId` (`UUID`)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Player removed successfully. | Text: `Jugador eliminado correctamente` |
| `409 Conflict` | Business or data-integrity conflict. | Error message text |

## Division coaches

Tag: `Division coaches`  
Controller path: `/coaches`

### `GET /coaches?divisionId={divisionId}`

Lists all coaches associated with a division. The result can be empty.

Query parameter: `divisionId` (`UUID`, required)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Division coaches returned successfully. | Array of `DivisionCoachResponseDTO` |
| `409 Conflict` | The division or request caused a business conflict. | Error message text |

### `GET /coaches/{divisionCoachId}`

Returns one division-coach association by its ID.

Path parameter: `divisionCoachId` (`UUID`)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Association found. | `DivisionCoachResponseDTO` |
| `404 Not Found` | No coach association exists with the specified ID. | Text: `No se encontro al entrenador asociado a la division` |

### `POST /coaches`

Registers a coach in a division and returns the association.

Request body: `DivisionCoachCreationDTO` (required)

```json
{
  "divisionId": "00000000-0000-0000-0000-000000000001",
  "userId": "00000000-0000-0000-0000-000000000003"
}
```

Required fields: `divisionId`, `userId`.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Coach registered successfully. | `DivisionCoachResponseDTO` |
| `409 Conflict` | Business or data-integrity conflict. | Error message text |

### `DELETE /coaches/{divisionCoachId}`

Removes a coach from a division.

Path parameter: `divisionCoachId` (`UUID`)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Coach removed successfully. | Text: `Entrenador eliminado correctamente` |
| `409 Conflict` | Business or data-integrity conflict. | Error message text |

## Matches

Tag: `Matches`  
Controller path: `/matches`

### `GET /matches/club?clubId={clubId}`

Lists all matches associated with a club. The result can be empty.

Query parameter: `clubId` (`UUID`, required)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Matches returned successfully. | Array of `MatchResponseDTO` |
| `409 Conflict` | The club or request caused a business conflict. | Error message text |

### `GET /matches/division?divisionId={divisionId}`

Lists all matches associated with a division. The result can be empty.

Query parameter: `divisionId` (`UUID`, required)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Matches returned successfully. | Array of `MatchResponseDTO` |
| `409 Conflict` | The division or request caused a business conflict. | Error message text |

### `GET /matches/{matchId}`

Returns one match by its ID.

Path parameter: `matchId` (`UUID`)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Match found. | `MatchResponseDTO` |
| `404 Not Found` | No match exists with the specified ID. | Text: `No se encontro el partido` |

### `POST /matches`

Creates a match. The service assigns the initial status `NOT_STARTED`.

Request body: `MatchCreationDTO` (required)

```json
{
  "date": "2026-09-09T18:30:00",
  "divisionId": "00000000-0000-0000-0000-000000000001",
  "opponent": "Rival Club"
}
```

Required fields: `date`, `divisionId`, `opponent`.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Match created successfully. | `MatchResponseDTO` |
| `409 Conflict` | Business or data-integrity conflict. | Error message text |

### `PUT /matches/{matchId}`

Updates a match and returns it.

Path parameter: `matchId` (`UUID`)

Request body: `MatchUpdateDTO` (required)

```json
{
  "date": "2026-09-09T20:00:00",
  "opponent": "Updated Rival Club",
  "status": "NOT_STARTED"
}
```

Required fields: `date`, `opponent`, `status`.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Match updated successfully. | `MatchResponseDTO` |
| `409 Conflict` | Business or data-integrity conflict. | Error message text |

### `DELETE /matches/{matchId}`

Deletes a match by its ID.

Path parameter: `matchId` (`UUID`)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Match deleted successfully. | Text: `Partido eliminado correctamente` |
| `409 Conflict` | Business or data-integrity conflict. | Error message text |

## Users

Tag: `Users`  
Controller path: `/user`

### `GET /user`

Lists all users in the system.

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | Users returned successfully. | Array of `User` |

### `GET /user/{userId}`

Returns one user by its ID.

Path parameter: `userId` (`UUID`)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | User found. | `User` |
| `404 Not Found` | The ID does not belong to any user. | Text: `Usuario no encontrado` |

### `POST /user`

Creates a user in the system.

Request body: `User` (required)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | User created successfully. | `User` |
| `409 Conflict` | Business conflict or data integrity violation. | Error message text |

### `PATCH /user/{userId}/role` (and `PUT /user/{userId}/role`)

Assigns or modifies a user's role in the platform.

**Security**: Restricted to `ADMIN_CLUB` (Club Administrator) or `ADMIN_OVALTRACK` (Super-admin).
- `ADMIN_CLUB` cannot assign `ADMIN_OVALTRACK`.
- A club admin cannot demote their own role if they manage an active club.
- Unauthorized roles (e.g. `PLAYER`) receive `403 Forbidden`.
- Unauthenticated requests receive `401 Unauthorized` / `403 Forbidden`.

Path parameter: `userId` (`UUID`)

Request body: `UserRoleUpdateDTO` (required)

```json
{
  "role": "COACH_ANALYST"
}
```

Allowed role values:
- `ADMIN_OVALTRACK`
- `ADMIN_CLUB`
- `COACH_ANALYST`
- `PLAYER`
- `COMMISSION`
- `NO_ROLE`

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | User role updated successfully. | `UserResponseDTO` |
| `400 Bad Request` | Missing or invalid role value. | `{"message": "El rol es obligatorio"}` |
| `401 Unauthorized` | Missing or invalid authentication token. | `{"message": "No autorizado: se requiere autenticación"}` |
| `403 Forbidden` | Access denied (caller does not have `ADMIN_CLUB` or `ADMIN_OVALTRACK`). | `{"message": "Acceso denegado: solo el administrador del club puede realizar esta acción"}` |
| `404 Not Found` | Target user not found. | `{"message": "Usuario no encontrado"}` |
| `409 Conflict` | Business rule violated (e.g., club admin assigning `ADMIN_OVALTRACK` or self-demotion). | `{"message": "<detalles del error>"}` |

### `DELETE /user/{userId}`

Deletes a user by its ID.

Path parameter: `userId` (`UUID`)

| Status | Meaning | Response body |
|---|---|---|
| `200 OK` | User deleted successfully. | Text: `Usuario eliminado correctamente` |
| `409 Conflict` | The user cannot be deleted because of related entities. | Error message text |

## DTO response schemas

### `ClubResponseDTO`

```json
{
  "id": "00000000-0000-0000-0000-000000000010",
  "name": "OvalTrack Club",
  "status": "ACTIVE",
  "adminUserId": "00000000-0000-0000-0000-000000000001",
  "city": "Montevideo",
  "logoUrl": "https://example.com/logo.png",
  "contactEmail": "club@example.com",
  "contactPhone": "+59800000000"
}
```

### `DivisionResponseDTO`

```json
{
  "id": "00000000-0000-0000-0000-000000000011",
  "name": "Senior A",
  "clubId": "00000000-0000-0000-0000-000000000001",
  "createdAt": "2026-09-09T18:00:00",
  "ageCategory": "SENIOR",
  "gender": "MIXED",
  "active": true
}
```

### `DivisionPlayerResponseDTO`

```json
{
  "id": "00000000-0000-0000-0000-000000000012",
  "userId": "00000000-0000-0000-0000-000000000002",
  "divisionId": "00000000-0000-0000-0000-000000000001",
  "jerseyNumber": 10,
  "position": "Forward",
  "startDate": "2026-09-09",
  "endDate": null
}
```

### `DivisionCoachResponseDTO`

```json
{
  "id": "00000000-0000-0000-0000-000000000013",
  "userId": "00000000-0000-0000-0000-000000000003",
  "divisionId": "00000000-0000-0000-0000-000000000001",
  "startDate": "2026-09-09",
  "endDate": null
}
```

### `MatchResponseDTO`

```json
{
  "id": "00000000-0000-0000-0000-000000000014",
  "date": "2026-09-09T18:30:00",
  "divisionId": "00000000-0000-0000-0000-000000000001",
  "opponent": "Rival Club",
  "status": "NOT_STARTED"
}
```

### `UserRoleUpdateDTO`

```json
{
  "role": "COACH_ANALYST"
}
```

### `UserResponseDTO`

```json
{
  "id": "00000000-0000-0000-0000-000000000002",
  "email": "jugador.uno@test.com",
  "role": "COACH_ANALYST",
  "active": true
}
```
