import React, { useState } from 'react';
// import { Auth } from 'aws-amplify'; // Uncomment when AWS is configured
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Mock authentication for initial UI development
            // await Auth.signIn(email, password);
            console.log('Logging in with:', email, password);
             if (email === 'admin@admin.com' && password === 'admin') {
                // Mocking successful login for the default admin user
                 localStorage.setItem('user_role', 'super_admin'); // Store role for RBAC logic demo
                 navigate('/dashboard');
            } else {
                 throw new Error('Invalid credentials');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login');
            console.error('Login error:', err);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
            <Row className="w-100 justify-content-center">
                <Col md={6} lg={4}>
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <h3>Admin Login</h3>
                                <p className="text-muted">Sign in to your dashboard</p>
                            </div>
                            
                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                    <Form.Label>Email address</Form.Label>
                                    <Form.Control 
                                        type="email" 
                                        placeholder="Enter email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required 
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="formBasicPassword">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control 
                                        type="password" 
                                        placeholder="Password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required 
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" className="w-100 mb-3" style={{ padding: '10px' }}>
                                    Login
                                </Button>
                            </Form>
                        </Card.Body>
                        <Card.Footer className="text-center py-3 bg-light border-0">
                           <small>Default: admin@admin.com / admin</small>
                        </Card.Footer>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
