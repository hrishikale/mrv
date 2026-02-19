import React, { useState } from 'react';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState<'LOGIN' | 'NEW_PASSWORD'>('LOGIN');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const { isSignedIn, nextStep } = await signIn({ username: email, password });
            console.log('Login result:', isSignedIn, nextStep);
            
            if (isSignedIn) {
                 localStorage.setItem('user_role', 'super_admin');
                 navigate('/dashboard');
            } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
                 setStep('NEW_PASSWORD');
            } else {
                 setError(`Login incomplete. Step: ${nextStep.signInStep}`);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login');
            console.error('Login error:', err);
        }
    };

    const handleNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const { isSignedIn } = await confirmSignIn({ 
                challengeResponse: newPassword,
                options: {
                    userAttributes: {
                        name: 'Admin User', // Default for initial admin
                        phone_number: '+15555555555' // Default dummy, or add input field if strict
                    }
                }
            });
            if (isSignedIn) {
                localStorage.setItem('user_role', 'super_admin');
                navigate('/dashboard');
            } else {
                setError('Login still incomplete after password change.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to change password');
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
            <Row className="w-100 justify-content-center">
                <Col md={6} lg={4}>
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <h3>{step === 'LOGIN' ? 'Admin Login' : 'Set New Password'}</h3>
                                <p className="text-muted">
                                    {step === 'LOGIN' ? 'Sign in to your dashboard' : 'Please set a new password to continue'}
                                </p>
                            </div>
                            
                            {error && <Alert variant="danger">{error}</Alert>}

                            {step === 'LOGIN' ? (
                                <Form onSubmit={handleLogin}>
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
                            ) : (
                                <Form onSubmit={handleNewPassword}>
                                    <Form.Group className="mb-4" controlId="formNewPassword">
                                        <Form.Label>New Password</Form.Label>
                                        <Form.Control 
                                            type="password" 
                                            placeholder="Enter new password" 
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required 
                                        />
                                    </Form.Group>

                                    <Button variant="primary" type="submit" className="w-100 mb-3" style={{ padding: '10px' }}>
                                        Set Password & Login
                                    </Button>
                                </Form>
                            )}
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
