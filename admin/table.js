class TableGenerator {
    static createTable(containerId, columns, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'data-table';
        
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.label;
            if (col.width) th.style.width = col.width;
            headerRow.appendChild(th);
        });
        
        if (options.actions) {
            const th = document.createElement('th');
            th.textContent = 'Acciones';
            headerRow.appendChild(th);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            
            columns.forEach(col => {
                const td = document.createElement('td');
                let value = item[col.key];
                
                if (col.render) {
                    td.innerHTML = col.render(value, item);
                } else if (col.type === 'date') {
                    td.textContent = new Date(value).toLocaleDateString();
                } else if (col.type === 'status') {
                    const statusClass = this.getStatusClass(value);
                    td.innerHTML = `<span class="status-badge ${statusClass}">${value}</span>`;
                } else {
                    td.textContent = value || '-';
                }
                
                row.appendChild(td);
            });
            
            if (options.actions) {
                const td = document.createElement('td');
                td.className = 'action-buttons';
                
                if (options.actions.edit) {
                    const editBtn = document.createElement('button');
                    editBtn.textContent = 'Editar';
                    editBtn.className = 'btn-edit';
                    editBtn.onclick = () => options.actions.edit(item);
                    td.appendChild(editBtn);
                }
                
                if (options.actions.delete) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Eliminar';
                    deleteBtn.className = 'btn-danger';
                    deleteBtn.onclick = () => {
                        const overlay = document.createElement('div');
                        overlay.className = 'modal-overlay';
                        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
                        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
                        overlay.innerHTML = `
                            <div class="modal-content" style="max-width:320px" onclick="event.stopPropagation()">
                                <div class="modal-header"><h3>Eliminar registro</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
                                <div class="modal-body"><p>¿Eliminar este registro? Esta acción no se puede deshacer.</p></div>
                                <div class="modal-footer">
                                    <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                                    <button class="btn-confirm" style="background:var(--danger)">Eliminar</button>
                                </div>
                            </div>`;
                        const confirmBtn = overlay.querySelector('.btn-confirm');
                        confirmBtn.onclick = () => { options.actions.delete(item); overlay.remove(); };
                        document.body.appendChild(overlay);
                    };
                    td.appendChild(deleteBtn);
                }
                
                row.appendChild(td);
            }
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        wrapper.appendChild(table);
        
        container.innerHTML = '';
        container.appendChild(wrapper);
        
        return table;
    }
    
    static getStatusClass(status) {
        const statusMap = {
            'Activo': 'status-active',
            'Inactivo': 'status-inactive',
            'Pendiente': 'status-pending',
            'Completado': 'status-completed',
            'Entregado': 'status-completed'
        };
        return statusMap[status] || 'status-pending';
    }
    
    static renderModal(title, content, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel">Cancelar</button>
                    <button class="btn-confirm">Confirmar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.btn-cancel');
        const confirmBtn = modal.querySelector('.btn-confirm');
        
        const closeModal = () => modal.remove();
        
        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;
        confirmBtn.onclick = () => {
            onConfirm();
            closeModal();
        };
        
        return modal;
    }
}