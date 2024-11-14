"use strict";

// Variables Iniciales
let totalRecords = 0;
let storedRecords = [];

let projectName = 'CLK';

// Variable para manejar el timeout de los mensajes de estado
let statusTimeout;

// Variables para el flujo de escaneo
let currentScan = 'part'; // 'part' o 'serial'
let tempPartCode = '';

// Función para actualizar la hora actual
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { hour12: false });
    document.getElementById('time').textContent = timeString;
}
setInterval(updateTime, 1000);
updateTime();

// Función para actualizar la fecha actual
function updateDate() {
    const now = new Date();
    // Formato de fecha: dd/mm/yyyy
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
    const year = now.getFullYear();
    const dateString = `${day}/${month}/${year}`;
    document.getElementById('currentDate').textContent = dateString;
}
updateDate();
setInterval(updateDate, 3600000); // Actualizar cada hora

// Función para actualizar el estado de Internet
function updateInternetStatus() {
    const led = document.getElementById('internetStatus');
    if (navigator.onLine) {
        led.style.backgroundColor = 'green';
        led.style.boxShadow = '0 0 5vw green';
    } else {
        led.style.backgroundColor = 'red';
        led.style.boxShadow = '0 0 5vw red';
    }
}
updateInternetStatus();
setInterval(updateInternetStatus, 2000); // Actualizar cada 2 segundos

// Referencia al campo de entrada de código de barras
const barcodeInput = document.getElementById('barcodeInput');

// Referencia al área de escaneo actual (Part y Serial)
const currentScanDiv = document.getElementById('currentScan');

// Placeholder para el campo de entrada
const placeholderFocused = 'Escanea el código';
const placeholderUnfocused = 'ERROR: Da clic';

// Eventos para el foco del campo de entrada
barcodeInput.addEventListener('focus', () => {
    barcodeInput.classList.remove('unfocused'); // Quitar la clase de resalte
    barcodeInput.placeholder = placeholderFocused;
});

barcodeInput.addEventListener('blur', () => {
    barcodeInput.classList.add('unfocused');
    barcodeInput.placeholder = placeholderUnfocused;
});

// Evento para procesar la entrada del código de barras al presionar Enter
barcodeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        processBarcodeInput();
    }
});

// Función centralizada para manejar los mensajes de estado
function setStatus(message, type = 'info') {
    const status = document.getElementById('status');

    // Limpiar cualquier timeout existente para evitar múltiples temporizadores
    if (statusTimeout) {
        clearTimeout(statusTimeout);
    }

    // Eliminar todas las clases de tipo previamente aplicadas
    status.classList.remove('success', 'error', 'deleted', 'info', 'warning', 'purple', 'fade-out', 'glow');

    // Asignar la clase correspondiente según el tipo de mensaje
    switch(type) {
        case 'success':
            status.classList.add('success', 'glow');
            break;
        case 'error':
            status.classList.add('error', 'glow');
            break;
        case 'deleted':
            status.classList.add('deleted', 'glow');
            break;
        case 'info':
            status.classList.add('info', 'glow');
            break;
        case 'warning':
            status.classList.add('warning', 'glow');
            break;
        case 'purple':
            status.classList.add('purple', 'glow');
            break;
        default:
            status.classList.add('info', 'glow');
    }

    // Establecer el mensaje de estado
    status.textContent = message;

    // Establecer un timeout para iniciar la animación de fadeOut después de 5 segundos
    statusTimeout = setTimeout(() => {
        // Añadir la clase 'fade-out' para iniciar la animación de desvanecimiento
        status.classList.add('fade-out');

        // Remover las clases de tipo después de la animación de fadeOut (1s)
        setTimeout(() => {
            status.textContent = '';
            status.classList.remove('success', 'error', 'deleted', 'info', 'warning', 'purple', 'fade-out');
        }, 1000); // Duración de la animación de fadeOut
    }, 5000); // 5000 milisegundos = 5 segundos
}

// Función principal para procesar la entrada del código de barras
function processBarcodeInput() {
    const barcode = barcodeInput.value.trim();
    barcodeInput.value = ''; // Limpiar el campo inmediatamente

    if (currentScan === 'part') {
        // Esperando un código que empiece con 'P'
        if (/^P/i.test(barcode)) {
            tempPartCode = barcode;
            currentScan = 'serial';
            currentScanDiv.textContent = `No. Part: ${tempPartCode}`;
            setStatus(`Part escaneado: ${tempPartCode}`, 'success');
        } else {
            // No es un código válido para Part
            setStatus(`- ${barcode} - No coincide`, 'error');
            // Mantener el flujo de escaneo en 'part' sin cambiar el estado
            currentScan = 'part';
            tempPartCode = '';
            currentScanDiv.textContent = '';
        }
    } else if (currentScan === 'serial') {
        // Esperando un código que empiece con 'S'
        if (/^S/i.test(barcode)) {
            const serialCode = barcode;
            const partCode = tempPartCode;
            currentScan = 'part'; // Resetear para el próximo registro
            tempPartCode = '';
            currentScanDiv.textContent = '';

            // Mostrar ambos códigos en el estado
            setStatus(`No. Part: ${partCode} - Serial: ${serialCode}`, 'info');

            // Registrar el par de códigos
            saveRecord(partCode, serialCode);
        } else {
            // No es un código válido para Serial
            setStatus(`- ${barcode} - No coincide`, 'error');
            // Mantener el flujo de escaneo en 'serial' sin resetear
            currentScan = 'serial';
            // No se limpia tempPartCode ni currentScanDiv
        }
    }

    // Reenfocar el campo de entrada
    setTimeout(() => {
        barcodeInput.focus();
    }, 100);
}

// Función para guardar un registro
function saveRecord(part, serial) {
    const now = new Date();
    // Formato de fecha: dd/mm/yyyy
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
    const year = now.getFullYear();
    const date = `${day}/${month}/${year}`;
    const time = now.toLocaleTimeString('es-ES', { hour12: false });

    // Crear el registro
    const record = { part, serial, date, time };
    storedRecords.push(record);
    localStorage.setItem('storedRecords', JSON.stringify(storedRecords));

    totalRecords++;
    localStorage.setItem('totalRecords', totalRecords);

    updateCounter();
    updateRecordsTable(); // Actualizar la tabla de registros
}

// Inicializar el contador de registros
function initializeCounter() {
    totalRecords = parseInt(localStorage.getItem('totalRecords')) || 0;
    document.getElementById('totalRecords').textContent = totalRecords;
}
initializeCounter();

// Función para actualizar el contador visualmente
function updateCounter() {
    const counterSpan = document.getElementById('totalRecords');
    counterSpan.textContent = totalRecords;
    counterSpan.classList.add('animate');
    setTimeout(() => {
        counterSpan.classList.remove('animate');
    }, 300);
}

// Cargar registros almacenados previamente con validación
function loadStoredRecords() {
    const stored = JSON.parse(localStorage.getItem('storedRecords')) || [];
    // Filtrar registros que tienen los campos necesarios
    storedRecords = stored.filter(record => record.part && record.serial && record.date && record.time);
    // Actualizar localStorage con registros válidos
    localStorage.setItem('storedRecords', JSON.stringify(storedRecords));
}
loadStoredRecords();

// Función para verificar si el LocalStorage está lleno
function isLocalStorageFull() {
    try {
        localStorage.setItem('testKey', 'testValue');
        localStorage.removeItem('testKey');
        return false;
    } catch (e) {
        return true;
    }
}

// Función para eliminar el último registro
document.getElementById('deleteLastRecord').addEventListener('click', () => {
    if (storedRecords.length === 0) {
        setStatus('No hay registros para eliminar.', 'purple');
        return;
    }

    // Capturar el último registro antes de eliminarlo
    const deletedRecord = storedRecords.pop();
    localStorage.setItem('storedRecords', JSON.stringify(storedRecords));

    totalRecords--;
    localStorage.setItem('totalRecords', totalRecords);
    updateCounter();

    // Actualizar el contador y notificar al usuario con el registro eliminado
    setStatus(`Registro eliminado: Part ${deletedRecord.part} - Serial ${deletedRecord.serial}`, 'deleted');

    // Actualizar la tabla de registros
    updateRecordsTable();

    // Reenfocar el campo de entrada
    setTimeout(() => {
        barcodeInput.focus();
    }, 100);
});

// Función para eliminar el Part escaneado actualmente
document.getElementById('deletePart').addEventListener('click', () => {
    if (currentScan === 'serial' && tempPartCode) {
        // Eliminar el Part escaneado y resetear el estado
        setStatus(`Part eliminado: ${tempPartCode}`, 'deleted');
        tempPartCode = '';
        currentScan = 'part';
        currentScanDiv.textContent = '';
    } else {
        setStatus('No hay un Part escaneado para eliminar.', 'purple');
    }

    // Reenfocar el campo de entrada
    setTimeout(() => {
        barcodeInput.focus();
    }, 100);
});

// Función para mantener el foco en el campo de entrada después de cualquier interacción
function maintainBarcodeInputFocus(event) {
    const target = event.target;

    const isInteractiveElement = target.closest('select') || target.closest('button') || target.closest('input');

    if (!isInteractiveElement) {
        setTimeout(() => {
            barcodeInput.focus();
        }, 100);
    }
}

document.addEventListener('mousedown', maintainBarcodeInputFocus);
document.addEventListener('touchstart', maintainBarcodeInputFocus);

// Reenfocar el campo de entrada al hacer clic en los botones de eliminación
document.getElementById('deleteLastRecord').addEventListener('click', () => {
    setTimeout(() => {
        barcodeInput.focus();
    }, 100);
});
document.getElementById('deletePart').addEventListener('click', () => {
    setTimeout(() => {
        barcodeInput.focus();
    }, 100);
});

// Función para actualizar la tabla de últimos 10 registros con numeración correcta
function updateRecordsTable() {
    const tableBody = document.getElementById('recordsTableBody');
    tableBody.innerHTML = ''; // Limpiar la tabla

    if (storedRecords.length === 0) {
        // Si no hay registros, no hacer nada o mostrar un mensaje opcional
        return;
    }

    // Ordenar los registros por fecha y hora descendente (más recientes primero)
    const sortedRecords = [...storedRecords].sort((a, b) => {
        const dateTimeA = parseDateTime(a.date, a.time);
        const dateTimeB = parseDateTime(b.date, b.time);
        return dateTimeB - dateTimeA; // Descendente
    });

    // Obtener los últimos 10 registros
    const lastTenRecords = sortedRecords.slice(0, 5);

    // Numeración secuencial: empezar en totalRecords y disminuir
    lastTenRecords.forEach((record, index) => {
        // Validar que el registro tenga todos los campos necesarios
        if (!record.part || !record.serial || !record.date || !record.time) {
            console.warn('Registro incompleto encontrado, se omitirá en la tabla.', record);
            return; // Saltar este registro
        }

        const row = document.createElement('tr');

        // Columna No.
        const noCell = document.createElement('td');
        noCell.textContent = totalRecords - index; // Numeración descendente
        row.appendChild(noCell);

        // Columna Fecha
        const dateCell = document.createElement('td');
        dateCell.textContent = record.date;
        row.appendChild(dateCell);

        // Columna Hora
        const timeCell = document.createElement('td');
        timeCell.textContent = record.time;
        row.appendChild(timeCell);

        // Columna Part
        const partCell = document.createElement('td');
        partCell.textContent = record.part;
        row.appendChild(partCell);

        // Columna Serial
        const serialCell = document.createElement('td');
        serialCell.textContent = record.serial;
        row.appendChild(serialCell);

        tableBody.appendChild(row);
    });
}

// Inicializar la tabla al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    updateRecordsTable();
});

// Función para descargar los registros como CSV cuando se presiona el botón
document.getElementById('downloadCSV').addEventListener('click', () => {
    downloadDataAsCSV();
});

// Función para descargar los registros como CSV
function downloadDataAsCSV() {
    if (storedRecords.length === 0) {
        setStatus('No hay datos para descargar.', 'purple');
        return;
    }

    const loader = document.getElementById('loader');

    loader.style.display = 'block';

    barcodeInput.disabled = true;

    const minProcessingTime = 3000; // 3000 milisegundos = 3 segundos
    const startTime = Date.now();

    setTimeout(() => {
        // Ordenar los registros por fecha y hora descendente (más recientes primero)
        const sortedRecords = [...storedRecords].sort((a, b) => {
            const dateTimeA = parseDateTime(a.date, a.time);
            const dateTimeB = parseDateTime(b.date, b.time);
            return dateTimeB - dateTimeA; // Descendente
        });

        // Obtener todos los registros para descargar
        const allRecords = sortedRecords;

        // Preparar contenido CSV
        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Fecha,Hora,Part,Serial\n'; // Cabeceras

        allRecords.forEach((record) => {
            const row = `${escapeCSV(record.date)},${escapeCSV(record.time)},${escapeCSV(record.part)},${escapeCSV(record.serial)}`;
            csvContent += row + '\n';
        });

        const now = new Date();
        const dateString = now.toLocaleDateString('es-ES').replace(/\//g, "'");
        const timeString = now.toLocaleTimeString('es-ES', { hour12: false }).replace(/:/g, ".");
        const fileName = `${projectName}-${dateString}-${timeString}.csv`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);

        // Asegurar que han pasado al menos 3 segundos
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minProcessingTime - elapsedTime);

        setTimeout(() => {
            link.click();
            document.body.removeChild(link);

            loader.style.display = 'none';

            barcodeInput.disabled = false;

            // Limpiar registros y contador
            storedRecords = [];
            localStorage.removeItem('storedRecords');

            totalRecords = 0;
            updateCounter();
            localStorage.removeItem('totalRecords');

            // Actualizar la tabla de registros
            updateRecordsTable();

            // Redirigir el foco al campo de entrada
            barcodeInput.focus();

            // Mostrar mensaje de estado
            setStatus('Datos descargados y registros reiniciados', 'info');
        }, remainingTime);

    }, 0);
}

// Función para escapar valores CSV
function escapeCSV(value) {
    if (typeof value === 'string') {
        value = value.replace(/"/g, '""'); // Escapar comillas dobles
        return `"${value}"`; // Envolver en comillas dobles
    }
    return value;
}

// Función para parsear fecha y hora con validaciones
function parseDateTime(dateStr, timeStr) {
    if (typeof dateStr !== 'string' || typeof timeStr !== 'string') {
        console.error('parseDateTime: dateStr o timeStr no son cadenas válidas.', { dateStr, timeStr });
        return new Date(0); // Retorna una fecha mínima si hay error
    }

    const dateParts = dateStr.split('/');
    const timeParts = timeStr.split(':');

    if (dateParts.length !== 3 || timeParts.length < 2) {
        console.error('parseDateTime: Formato de fecha u hora incorrecto.', { dateStr, timeStr });
        return new Date(0);
    }

    const [day, month, year] = dateParts.map(Number);
    const [hours, minutes, seconds = 0] = timeParts.map(Number); // seconds por defecto a 0 si no existen

    if ([day, month, year, hours, minutes, seconds].some(isNaN)) {
        console.error('parseDateTime: Uno o más componentes de la fecha/hora no son números válidos.', { day, month, year, hours, minutes, seconds });
        return new Date(0);
    }

    return new Date(year, month - 1, day, hours, minutes, seconds);
}
