import React, { useState } from 'react';
import { Table, Button, Card, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import { get, post } from 'aws-amplify/api';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    access: string;
}

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch users on load
    React.useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const restOperation = get({ 
                apiName: 'DashboardAPI',
                path: '/users' 
            });
            const { body } = await restOperation.response;
            const data = await body.json();
            setUsers(data as unknown as User[]);
        } catch (error) {
            console.error('Error fetching users:', error);
            // Fallback mock data if API fails (for demo continuity if config is wrong)
            setUsers([
                { id: '1', name: 'Admin User (Mock)', email: 'admin@admin.com', phone: '1234567890', role: 'Super Admin', access: 'EDIT' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', role: 'User', access: 'VIEW' });

    const handleClose = () => setShowAddModal(false);
    const handleShow = () => setShowAddModal(true);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const restOperation = post({
                apiName: 'DashboardAPI',
                path: '/users',
                options: {
                    body: newUser
                }
            });
            const { body } = await restOperation.response;
            await body.json(); // Wait for response
            
            // Refresh list
            fetchUsers();
            handleClose();
        } catch (error) {
             console.error('Error adding user:', error);
             alert('Failed to add user');
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Users Management</h2>
                <Button variant="primary" onClick={handleShow}>
                    + Add New User
                </Button>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table hover responsive className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0">Name</th>
                                <th className="border-0">Email</th>
                                <th className="border-0">Phone</th>
                                <th className="border-0">Role</th>
                                <th className="border-0">Access List</th>
                                <th className="border-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="align-middle">{user.name}</td>
                                    <td className="align-middle">{user.email}</td>
                                    <td className="align-middle">{user.phone}</td>
                                    <td className="align-middle">
                                        <Badge bg={user.role === 'Super Admin' ? 'danger' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </td>
                                    <td className="align-middle">
                                        <Badge bg="info" text="dark">{user.access}</Badge>
                                    </td>
                                    <td className="align-middle">
                                        <Button variant="link" size="sm" className="text-secondary p-0 me-2">Edit</Button>
                                        <Button variant="link" size="sm" className="text-danger p-0">Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Add User Modal */}
            <Modal show={showAddModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleAddUser}>
                        <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="name" 
                                required 
                                onChange={handleInputChange} 
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control 
                                type="email" 
                                name="email" 
                                required 
                                onChange={handleInputChange} 
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control 
                                type="tel" 
                                name="phone" 
                                required 
                                onChange={handleInputChange} 
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Role</Form.Label>
                                    <Form.Select name="role" onChange={handleInputChange}>
                                        <option value="User">User</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Super Admin">Super Admin</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Access Level</Form.Label>
                                    <Form.Select name="access" onChange={handleInputChange}>
                                        <option value="VIEW">VIEW</option>
                                        <option value="ADD">ADD</option>
                                        <option value="EDIT">EDIT</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="secondary" onClick={handleClose} className="me-2">
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                Create User
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Users;
