# Lista de verificacion para revision del cliente

**Proyecto:** 14 dias de dulce amor — Calendario de San Valentin 2027
**Fase:** 8

---

## Parte 1: Revision visual (no requiere credenciales de pago)

### 1.1 Secuencia de recetas

Verificar que el orden del calendario coincida con ORDEN DE LAS RECETAS.docx:

| Dia | Receta | Correcto |
|-----|--------|----------|
| 1 | Bizcocho de chocolate sin harina | [ ] |
| 2 | Galletas de fresa y gotitas de chocolate | [ ] |
| 3 | Los mejores mini cheesecakes de chocolate | [ ] |
| 4 | Cupcakes de chocolate y guineo | [ ] |
| 5 | Galletas de doble chocolate | [ ] |
| 6 | Mantequilla de chocolate | [ ] |
| 7 | Limonada de fresa | [ ] |
| 8 | Galletas de polvo de fresas | [ ] |
| 9 | Bizcocho de chocolate con harina Swans Down | [ ] |
| 10 | Las mejores galletas de chocolate chips | [ ] |
| 11 | Frosting de chocolate | [ ] |
| 12 | Dip cremoso de chocolate 1 y 2 | [ ] |
| 13 | Galletas de Oreo y chocolate chips | [ ] |
| 14 | Super coquito de Nutella | [ ] |

### 1.2 Titulos de recetas

- [ ] Cada titulo aparece correctamente escrito en el calendario
- [ ] Los titulos coinciden en la pagina principal, el calendario y el panel de administracion
- [ ] El titulo del Dia 12 incluye "1 y 2"

### 1.3 Imagenes de recetas

- [ ] **Pendiente:** no hay fotos individuales por receta. El cliente debe proporcionar imagenes o confirmar que se usaran las del video de YouTube.

### 1.4 Ingredientes y preparacion

Recetas con contenido completo (verificar que los ingredientes, pasos y notas sean correctos):

- [ ] Dia 1: Bizcocho de chocolate sin harina (5 ingredientes, 6 pasos, 4 notas)
- [ ] Dia 3: Los mejores mini cheesecakes de chocolate (3 grupos de ingredientes, instrucciones de horneado)
- [ ] Dia 4: Cupcakes de chocolate y guineo (11 ingredientes, instrucciones de horneado)
- [ ] Dia 6: Mantequilla de chocolate (6 ingredientes + items para servir)
- [ ] Dia 14: Super coquito de Nutella (video presente, **ingredientes pendientes**)

Recetas pendientes de contenido (solo muestran titulo y numero de dia):

- [ ] Dias 2, 5, 7, 8, 9, 10, 11, 12, 13 — confirmar que el cliente proporcionara el material

### 1.5 Dia 14: Cierre especial

- [ ] El video de Super coquito de Nutella se reproduce correctamente (ID: KvAklBTkOPc)
- [ ] Aparece la seccion "Tu plan para el 14 de febrero" debajo de la receta
- [ ] El mensaje "Feliz San Valentin" cierra la experiencia
- [ ] La etiqueta "Cierre especial" es visible

### 1.6 Navegacion del calendario

- [ ] Los 14 dias aparecen en la cuadricula del calendario
- [ ] Los dias futuros estan bloqueados con candado
- [ ] Los dias desbloqueados se pueden seleccionar
- [ ] Al seleccionar un dia se muestra su contenido
- [ ] La fecha del proximo dia aparece correctamente

### 1.7 Apariencia

- [ ] La pagina principal se ve correctamente en movil
- [ ] La pagina principal se ve correctamente en escritorio
- [ ] El calendario se ve correctamente en movil
- [ ] El calendario se ve correctamente en escritorio
- [ ] El banner principal (oso de peluche, corazones, destellos dorados) se muestra bien
- [ ] Los textos son legibles sobre la imagen de fondo
- [ ] Las animaciones funcionan suavemente
- [ ] Los colores (rojo, rosa, dorado) son consistentes

---

## Parte 2: Pruebas de integracion (requiere credenciales configuradas)

### 2.1 Flujo de compra

- [ ] La pagina /comprar/ carga correctamente
- [ ] Se pueden ingresar nombre y correo del cliente
- [ ] El precio aparece correctamente (debe configurarse en Admin > Configuracion)

### 2.2 Metodos de pago

**PayPal (requiere credenciales Sandbox):**
- [ ] El boton de PayPal aparece cuando esta habilitado
- [ ] Se puede completar una compra de prueba con cuenta Sandbox
- [ ] El pedido aparece como "pagado" en Admin > Pedidos
- [ ] El cliente recibe acceso al calendario

**Zelle (verificacion manual):**
- [ ] El cliente puede seleccionar Zelle como metodo de pago
- [ ] Se muestran las instrucciones de pago con los datos del destinatario
- [ ] El pedido aparece como "pendiente de verificacion" en Admin > Pedidos
- [ ] El administrador puede aprobar o rechazar el pago
- [ ] Al aprobar, el cliente recibe acceso al calendario

**ATH Movil (BLOQUEADO):**
- [ ] **Pendiente:** requiere cuenta de comerciante ATH Movil Business de Evertec
- [ ] No existe entorno de pruebas (sandbox)

### 2.3 Correo electronico

- [ ] Se envia confirmacion de compra al cliente
- [ ] Se envia enlace de acceso al calendario
- [ ] Los correos estan escritos en espanol
- [ ] Los correos usan los titulos correctos de las recetas

### 2.4 Panel de administracion

- [ ] El inicio de sesion funciona con las credenciales de administrador
- [ ] Se pueden ver los 14 dias del calendario
- [ ] Se pueden editar titulos y contenido de recetas
- [ ] Se puede configurar el precio y activar ventas
- [ ] Se pueden habilitar/deshabilitar metodos de pago
- [ ] Se pueden ver y gestionar pedidos
- [ ] Se pueden aprobar/rechazar pagos de Zelle

---

## Aprobaciones pendientes del cliente

1. **Contenido de 9 recetas:** ingredientes, pasos, videos de YouTube
2. **Ingredientes del coquito de Nutella**
3. **Precio del calendario**
4. **Imagenes individuales por receta** (opcional)
5. **Credenciales de PayPal de produccion** (cuando se active)
6. **Cuenta de ATH Movil Business** (cuando se obtenga)
7. **Datos de Zelle del destinatario** (nombre, correo o telefono)
8. **Dominio verificado en Resend** para envio de correos
