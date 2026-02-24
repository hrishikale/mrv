import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Badge, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import { get, post, put, del } from 'aws-amplify/api';

interface Permission {
    [module: string]: string[]; // e.g., { "Dashboard": ["VIEW"], "Setup": ["VIEW", "EDIT"] }
}

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission;
}

const MODULES = ['Dashboard', 'Setup', 'Reports'];

const Roles: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState<{ name: string; description: string; permissions: Permission }>({
        name: '',
        description: '',
        permissions: {}
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const restOperation = get({ apiName: 'DashboardAPI', path: '/roles' });
            const { body } = await restOperation.response;
            const data = await body.json();
            setRoles(data as unknown as Role[]);
        } catch (err) {
            console.error('Error fetching roles:', err);
            setError('Failed to fetch roles');
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionChange = (module: string, type: 'VIEW' | 'EDIT', checked: boolean) => {
        setFormData(prev => {
            const newPerms = { ...prev.permissions };
            const modulePerms = newPerms[module] || [];

            if (checked) {
                if (type === 'EDIT') {
                    // Edit implies View
                    if (!modulePerms.includes('VIEW')) modulePerms.push('VIEW');
                    if (!modulePerms.includes('EDIT')) modulePerms.push('EDIT');
                } else {
                    if (!modulePerms.includes('VIEW')) modulePerms.push('VIEW');
                }
            } else {
                if (type === 'VIEW') {
                    // Uncheck View implies Uncheck Edit
                    return { ...prev, permissions: { ...newPerms, [module]: [] } }; // Clear all for module
                } else {
                    // Uncheck Edit
                    const idx = modulePerms.indexOf('EDIT');
                    if (idx > -1) modulePerms.splice(idx, 1);
                }
            }
            return { ...prev, permissions: { ...newPerms, [module]: modulePerms } };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Validation: At least one module must have VIEW
        const hasAccess = Object.values(formData.permissions).some(p => p.includes('VIEW'));
        if (!hasAccess) {
            setError('Role must have VIEW access to at least one module.');
            return;
        }

        setLoading(true);
        try {
            if (editingRole) {
                const restOperation = put({
                    apiName: 'DashboardAPI',
                    path: '/roles',
                    options: { body: { ...formData, id: editingRole.id } }
                });
                await restOperation.response;
            } else {
                const restOperation = post({
                    apiName: 'DashboardAPI',
                    path: '/roles',
                    options: { body: formData }
                });
                await restOperation.response;
            }
            fetchRoles();
            handleClose();
        } catch (err: any) {
            console.error('Save error:', err);
            setError('Failed to save role. Name might be duplicate.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure? This cannot be undone.')) return;
        try {
            const restOperation = del({
                apiName: 'DashboardAPI',
                path: '/roles',
                options: {
                    queryParams: { id }
                }
            });
            await restOperation.response;
            fetchRoles();
        } catch (err: any) {
             alert('Failed to delete: ' + (err.message || 'Unknown error'));
        }
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description,
            permissions: role.permissions
        });
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: {} });
        setError('');
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Roles Management</h2>
                <Button onClick={() => setShowModal(true)}>+ Add New Role</Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Permissions</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(role => (
                                <tr key={role.id}>
                                    <td>{role.name}</td>
                                    <td>{role.description}</td>
                                    <td>
                                        {Object.entries(role.permissions).map(([mod, perms]) => (
                                            perms.includes('VIEW') && (
                                                <Badge key={mod} bg="info" className="me-1 text-dark">
                                                    {mod} {perms.includes('EDIT') ? '(Edit)' : ''}
                                                </Badge>
                                            )
                                        ))}
                                    </td>
                                    <td>
                                        <Button size="sm" variant="link" onClick={() => handleEdit(role)}>Edit</Button>
                                        <Button size="sm" variant="link" className="text-danger" onClick={() => handleDelete(role.id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                            {roles.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="text-center py-4">No roles found. Create one!</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingRole ? 'Edit Role' : 'Add New Role'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Role Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                required 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                disabled={!!editingRole} // Prevent changing name/ID for simplicity
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={2}
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </Form.Group>

                        <h5 className="mt-4 mb-3">Permissions Matrix</h5>
                        <Table bordered size="sm">
                            <thead>
                                <tr>
                                    <th>Module</th>
                                    <th className="text-center">View</th>
                                    <th className="text-center">Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MODULES.map(module => {
                                    const perms = formData.permissions[module] || [];
                                    return (
                                        <tr key={module}>
                                            <td>{module}</td>
                                            <td className="text-center">
                                                <Form.Check 
                                                    checked={perms.includes('VIEW')}
                                                    onChange={e => handlePermissionChange(module, 'VIEW', e.target.checked)}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <Form.Check 
                                                    checked={perms.includes('EDIT')}
                                                    onChange={e => handlePermissionChange(module, 'EDIT', e.target.checked)}
                                                    disabled={!perms.includes('VIEW')} // Cannot edit if cannot view
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Role'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default Roles;
