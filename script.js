"use strict";

// Variables Iniciales
let totalRecords = 0;
let storedRecords = [];
const downloadCodes = ['272545', '111111'];

let projectName = 'CLK';

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
setInterval(updateDate, 3600000);

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
setInterval(updateInternetStatus, 2000);

// Referencia al campo de entrada de código de barras
const barcodeInput = document.getElementById('barcodeInput');

// Placeholder para el campo de entrada
const placeholderFocused = 'Escanea el codigo';
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

// Función principal para procesar la entrada del código de barras
function processBarcodeInput() {
    const barcode = barcodeInput.value.trim();
    const status = document.getElementById('status');

    // Verificar si es para descargar datos
    if (downloadCodes.includes(barcode)) {
        downloadDataAsCSV();
        barcodeInput.value = '';
        status.textContent = 'Datos descargados y registros reiniciados';
        status.classList.remove('error');
        void status.offsetWidth;
        status.style.animation = 'glow 1s ease-in-out infinite alternate';
        return;
    }

    if (/^\d{6}$/.test(barcode)) {
        // Verificar límite de almacenamiento
        if (isLocalStorageFull()) {
            status.textContent = 'No se permiten más registros';
            status.classList.add('error');
            barcodeInput.value = '';
            return;
        }

        const now = new Date();
        // Formato de fecha: dd/mm/yyyy
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
        const year = now.getFullYear();
        const date = `${day}/${month}/${year}`;
        const time = now.toLocaleTimeString('es-ES', { hour12: false });

        // Guardar registro
        saveRecord(barcode, date, time);
        barcodeInput.value = ''; // Limpiar el campo después de guardar

        status.textContent = `${barcode} Registrado`;
        status.classList.remove('error');
        void status.offsetWidth;
        status.style.animation = 'glow 1s ease-in-out infinite alternate';
    } else {
        status.textContent = 'ID no reconocido';
        status.classList.add('error'); // Aplicar la clase de error
    }

    // Reenfocar el campo de entrada
    setTimeout(() => {
        barcodeInput.focus();
    }, 100);
}

// Función para guardar un registro
function saveRecord(barcode, date, time) {
    storedRecords.push({ barcode, date, time });
    localStorage.setItem('storedRecords', JSON.stringify(storedRecords));

    totalRecords++;
    updateCounter();
    localStorage.setItem('totalRecords', totalRecords);

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

// Cargar registros almacenados previamente
storedRecords = JSON.parse(localStorage.getItem('storedRecords')) || [];

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

// Funciones relacionadas con actividades han sido eliminadas

// Función para descargar los registros como CSV
function downloadDataAsCSV() {
    if (storedRecords.length === 0) {
        alert('No hay datos para descargar.');
        return;
    }

    const status = document.getElementById('status');
    const loader = document.getElementById('loader');

    loader.style.display = 'block';

    barcodeInput.disabled = true;

    const minProcessingTime = 3000; // 3000 milisegundos = 3 segundos
    const startTime = Date.now();

    setTimeout(() => {
        // Ordenar los registros por fecha y hora
        storedRecords.sort((a, b) => {
            const dateTimeA = parseDateTime(a.date, a.time);
            const dateTimeB = parseDateTime(b.date, b.time);
            return dateTimeA - dateTimeB;
        });

        // Preparar contenido CSV
        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'No.,Fecha,Hora,Codigo\n'; // Añadido No. y renombrado Codigo

        storedRecords.forEach((record, index) => {
            const no = index + 1;
            const row = `${no},${escapeCSV(record.date)},${escapeCSV(record.time)},${escapeCSV(record.barcode)}`;
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

            storedRecords = [];
            localStorage.removeItem('storedRecords');

            totalRecords = 0;
            updateCounter();
            localStorage.removeItem('totalRecords');

            clearUserActivities(); // Asegúrate de eliminar o implementar esta función si no la usas.

            status.textContent = 'Datos descargados y registros reiniciados';
            status.classList.remove('error');
            void status.offsetWidth;
            status.style.animation = 'glow 1s ease-in-out infinite alternate';

            setTimeout(() => {
                barcodeInput.focus();
            }, 100);

            updateRecordsTable(); // Limpiar la tabla de registros
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

// Función para parsear fecha y hora
function parseDateTime(dateStr, timeStr) {
    const [day, month, year] = dateStr.split('/').map(Number);
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
}

// Función para eliminar el último registro
document.getElementById('deleteLastRecord').addEventListener('click', () => {
    if (storedRecords.length === 0) {
        alert('No hay registros para eliminar.');
        return;
    }

    // Capturar el último registro antes de eliminarlo
    const deletedRecord = storedRecords.pop();
    localStorage.setItem('storedRecords', JSON.stringify(storedRecords));

    totalRecords--;
    updateCounter();
    localStorage.setItem('totalRecords', totalRecords);

    // Actualizar el contador y notificar al usuario con el barcode eliminado
    const status = document.getElementById('status');
    status.textContent = `Registro -${deletedRecord.barcode}- eliminado`;
    status.classList.remove('error');
    void status.offsetWidth;
    status.style.animation = 'glow 1s ease-in-out infinite alternate';

    // Actualizar la tabla de registros
    updateRecordsTable();

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

// Reenfocar el campo de entrada al hacer clic en el botón de eliminación
document.getElementById('deleteLastRecord').addEventListener('click', () => {
    setTimeout(() => {
        barcodeInput.focus();
    }, 100);
});

// Función para actualizar la tabla de últimos 10 registros
function updateRecordsTable() {
    const tableBody = document.getElementById('recordsTableBody');
    tableBody.innerHTML = ''; // Limpiar la tabla

    // Obtener los últimos 10 registros
    const lastTenRecords = storedRecords.slice(-10).reverse(); // Más recientes primero

    lastTenRecords.forEach((record, index) => {
        const row = document.createElement('tr');

        // Columna No.
        const noCell = document.createElement('td');
        noCell.textContent = totalRecords - (lastTenRecords.length - 1) + index;
        row.appendChild(noCell);

        // Columna Fecha
        const dateCell = document.createElement('td');
        dateCell.textContent = record.date;
        row.appendChild(dateCell);

        // Columna Hora
        const timeCell = document.createElement('td');
        timeCell.textContent = record.time;
        row.appendChild(timeCell);

        // Columna Código
        const codeCell = document.createElement('td');
        codeCell.textContent = record.barcode;
        row.appendChild(codeCell);

        tableBody.appendChild(row);
    });
}

// Inicializar la tabla al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    updateRecordsTable();
});
