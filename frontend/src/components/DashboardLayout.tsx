import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, Row, Col, NavDropdown, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap'; // Need to install this or use standard Link

// Simple Sidebar Component
const Sidebar = () => {
    return (
        <div className="bg-dark text-white p-3" style={{ minHeight: '100vh' }}>
            <h4 className="mb-4">Dashboard</h4>
            <Nav className="flex-column">
                <LinkContainer to="/dashboard">
                    <Nav.Link className="text-white mb-2">Overview</Nav.Link>
                </LinkContainer>
                
                <div className="text-muted small fw-bold text-uppercase mt-3 mb-2">Setup</div>
                <LinkContainer to="/dashboard/setup/users">
                    <Nav.Link className="text-white">Users</Nav.Link>
                </LinkContainer>
            </Nav>
        </div>
    );
};

const Header = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        // Clear auth tokens
        localStorage.removeItem('user_role');
        navigate('/login');
    };

    return (
        <Navbar bg="white" variant="light" className="shadow-sm px-4 justify-content-between">
            <Navbar.Brand>Admin Panel</Navbar.Brand>
            <Button variant="outline-danger" size="sm" onClick={handleLogout}>Logout</Button>
        </Navbar>
    );
};

const DashboardLayout: React.FC = () => {
    return (
        <Container fluid className="p-0 overflow-hidden">
            <Row className="g-0">
                <Col md={2} className="d-none d-md-block">
                    <Sidebar />
                </Col>
                <Col md={10} style={{ backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
                    <Header />
                    <Container fluid className="p-4">
                        <Outlet />
                    </Container>
                </Col>
            </Row>
        </Container>
    );
};

export default DashboardLayout;
