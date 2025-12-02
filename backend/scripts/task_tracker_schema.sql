-- Task Tracker & Projects Module Database Schema (Fixed)

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, on_hold, completed, cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    start_date DATE,
    due_date DATE,
    completion_date DATE,
    budget DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2),
    project_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Task Departments Table (for Project Admin)
CREATE TABLE IF NOT EXISTS task_departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Task Subcategories Table (for Project Admin)
CREATE TABLE IF NOT EXISTS task_subcategories (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES task_departments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_id, name)
);

-- 4. Tasks Table (Fixed - removed generated column)
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ticket_number VARCHAR(100),
    ticket_url TEXT,
    priority VARCHAR(10) NOT NULL, -- P1, P2, P3, P4, P5
    department_id INTEGER REFERENCES task_departments(id) ON DELETE SET NULL,
    subcategory_id INTEGER REFERENCES task_subcategories(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, -- NULL if adhoc task
    status VARCHAR(50) DEFAULT 'pending', -- pending, on-going, awaiting_feedback, closed
    start_date DATE,
    due_date DATE,
    close_date DATE,
    total_hours DECIMAL(8, 2) DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Task Team Members Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS task_team_members (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    hours_worked DECIMAL(8, 2) DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, user_id)
);

-- 6. Create View for Overdue Calculation
CREATE OR REPLACE VIEW tasks_with_status AS
SELECT 
    t.*,
    CASE 
        WHEN t.status = 'closed' AND t.close_date IS NOT NULL AND t.due_date IS NOT NULL 
        THEN t.close_date > t.due_date
        WHEN t.status != 'closed' AND t.due_date IS NOT NULL 
        THEN CURRENT_DATE > t.due_date
        ELSE false
    END as is_overdue
FROM tasks t;

-- 7. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_team_members_user ON task_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_task_team_members_task ON task_team_members(task_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);

-- 8. Add Permissions for Task Tracker Module
INSERT INTO permissions (name, description, category) VALUES 
    ('view_tasks', 'View tasks', 'tasks'),
    ('create_tasks', 'Create new tasks', 'tasks'),
    ('edit_tasks', 'Edit tasks', 'tasks'),
    ('delete_tasks', 'Delete tasks', 'tasks'),
    ('view_projects', 'View projects', 'projects'),
    ('create_projects', 'Create new projects', 'projects'),
    ('edit_projects', 'Edit projects', 'projects'),
    ('delete_projects', 'Delete projects', 'projects'),
    ('manage_task_admin', 'Manage task departments and subcategories', 'tasks')
ON CONFLICT (name) DO NOTHING;

-- 9. Grant Permissions to Admin Role (Check if your table is named role_permissions or roles_permissions)
-- If this fails, you may need to adjust the table name
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p
        WHERE r.name = 'admin' AND p.name IN (
            'view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks',
            'view_projects', 'create_projects', 'edit_projects', 'delete_projects',
            'manage_task_admin'
        )
        ON CONFLICT DO NOTHING;
        
        -- Grant Task Permissions to General User Role
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p
        WHERE r.name = 'user' AND p.name IN (
            'view_tasks', 'create_tasks', 'edit_tasks'
        )
        ON CONFLICT DO NOTHING;
    ELSE
        RAISE NOTICE 'role_permissions table not found - you will need to grant permissions manually';
    END IF;
END $$;

-- 10. Insert Some Default Departments
INSERT INTO task_departments (name, description, is_active) VALUES
    ('Security Operations', 'Security operations and monitoring tasks', true),
    ('Penetration Testing', 'Penetration testing and vulnerability assessment', true),
    ('Compliance', 'Compliance and audit related tasks', true),
    ('Incident Response', 'Security incident response and investigation', true),
    ('Consulting', 'Client consulting and advisory services', true),
    ('Infrastructure', 'Infrastructure setup and maintenance', true),
    ('Development', 'Software development and customization', true),
    ('Support', 'Technical support and troubleshooting', true)
ON CONFLICT (name) DO NOTHING;

-- 11. Create a function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_departments_updated_at ON task_departments;
CREATE TRIGGER update_task_departments_updated_at BEFORE UPDATE ON task_departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_subcategories_updated_at ON task_subcategories;
CREATE TRIGGER update_task_subcategories_updated_at BEFORE UPDATE ON task_subcategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Verification Query
SELECT 'Task Tracker schema installed successfully!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('projects', 'task_departments', 'task_subcategories', 'tasks', 'task_team_members')
ORDER BY table_name;