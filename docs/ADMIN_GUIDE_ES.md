# Guia de Administracion

## Acceso

Navega a `/admin` en tu sitio. Inicia sesion con tu email y contrasena de administrador.

## Pestanas

### Resumen

Vista general del estado del negocio:
- Total de pedidos, pendientes, pagados y fallidos
- Total de clientes registrados
- Ingresos totales y por metodo de pago
- Advertencias de configuracion (precio no establecido, integraciones faltantes)
- Pedidos esperando verificacion (Zelle)
- Pedidos recientes

### Pedidos

Gestion completa de pedidos:
- Filtrar por estado: todos, pendientes, pagados, fallidos, verificacion
- Ver detalles de cada pedido (cliente, metodo, monto, fecha)
- **Aprobar** pedidos Zelle (verifica el pago antes de aprobar)
- **Rechazar** pedidos con notas explicativas
- **Reenviar email** de confirmacion
- Paginacion para listas largas

### Recetas

Gestion de recetas del calendario:
- Lista de todas las recetas
- Crear nueva receta con campos:
  - Titulo y categoria
  - Descripcion
  - Pasos de preparacion (lista)
  - Instrucciones de horneado (lista)
  - Notas (lista)
  - Ingredientes con grupos opcionales
  - Videos de YouTube (URL o ID)
- Editar recetas existentes
- Archivar recetas (no se pueden archivar si estan asignadas a un dia)

### Calendario

Configuracion de los 14 dias (1-14 de febrero):
- Asignar receta a cada dia
- Cambiar tipo de dia (receta, bonus, mensaje)
- Marcar dias como publicados
- **Publicar todos**: publica todos los dias que tengan receta asignada
- Advertencias sobre dias sin receta o sin publicar

### Clientes

Gestion de acceso de clientes:
- Buscar por nombre o email
- Ver historial de compras
- Ver estado de acceso al calendario
- **Revocar acceso** (desactivar token)
- **Activar acceso** (reactivar token)
- **Reenviar correo de acceso**

### Configuracion

Ajustes generales del sitio:
- **Precio del producto** (en USD, se almacena en centavos)
- **Ventas activadas/desactivadas** (interruptor global)
- **Metodos de pago**: activar/desactivar PayPal, ATH Movil, Zelle
- **Datos de Zelle**: nombre, email y telefono del destinatario
- **Estado de integraciones**: muestra si cada servicio esta configurado

## Flujo de Verificacion Zelle

1. El cliente selecciona Zelle al comprar
2. Se le muestran los datos para transferir
3. El pedido aparece en "Esperando verificacion"
4. Verifica el pago en tu cuenta bancaria o notificacion de Zelle
5. Aprueba o rechaza en la pestana Pedidos
6. Al aprobar, el sistema automaticamente:
   - Marca el pago como completado
   - Genera token de acceso al calendario
   - Envia email de confirmacion al cliente

## Seguridad

- Nunca apruebes un pago Zelle basandote solo en una captura de pantalla del cliente
- Los tokens de acceso se almacenan hasheados en la base de datos
- Las acciones de administracion se registran en `audit_logs`
- El rate limiting protege contra ataques de fuerza bruta
