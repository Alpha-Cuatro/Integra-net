document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

function loadDashboardData() {
    const estudiantes = JSON.parse(localStorage.getItem('admin_estudiantes')) || [];
    const docentes = JSON.parse(localStorage.getItem('admin_docentes')) || [];
    const tareas = JSON.parse(localStorage.getItem('admin_tareas')) || [];
    const actividades = JSON.parse(localStorage.getItem('admin_actividades')) || [];
    
    const statsHtml = `
        <div class="row">
            <div class="col"><strong>👨‍🎓 Estudiantes:</strong> ${estudiantes.length}</div>
            <div class="col"><strong>👨‍🏫 Docentes:</strong> ${docentes.length}</div>
            <div class="col"><strong>📋 Tareas:</strong> ${tareas.length}</div>
            <div class="col"><strong>🎮 Actividades:</strong> ${actividades.length}</div>
        </div>
    `;
    document.getElementById('stats-container').innerHTML = statsHtml;
    
    const pendingTasks = tareas.filter(t => t.estado === 'Pendiente');
    let tasksHtml = '<ul style="list-style:none;padding:0">';
    pendingTasks.slice(0, 5).forEach(t => {
        tasksHtml += `<li style="padding:8px 0;border-bottom:1px solid #eee">📌 ${t.titulo} - ${t.materia} (Entrega: ${t.fechaEntrega})</li>`;
    });
    tasksHtml += pendingTasks.length === 0 ? '<li>No hay tareas pendientes</li>' : '';
    tasksHtml += '</ul>';
    document.getElementById('next-tasks').innerHTML = tasksHtml;
    
    let activitiesHtml = '<ul style="list-style:none;padding:0">';
    actividades.slice(0, 5).forEach(a => {
        activitiesHtml += `<li style="padding:8px 0;border-bottom:1px solid #eee">🎯 ${a.nombre} (${a.tipo}) - Inicia: ${a.fechaInicio}</li>`;
    });
    activitiesHtml += actividades.length === 0 ? '<li>No hay actividades registradas</li>' : '';
    activitiesHtml += '</ul>';
    document.getElementById('recent-activities').innerHTML = activitiesHtml;
}