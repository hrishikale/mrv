import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';

const Overview: React.FC = () => {
    return (
        <div>
            <h2 className="mb-4">Overview</h2>
            <Row>
                <Col md={4}>
                    <Card className="text-center shadow-sm border-0 mb-4">
                        <Card.Body>
                            <h3 className="text-primary">125</h3>
                            <div className="text-muted">Total Users</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center shadow-sm border-0 mb-4">
                        <Card.Body>
                            <h3 className="text-success">Active</h3>
                            <div className="text-muted">System Status</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center shadow-sm border-0 mb-4">
                        <Card.Body>
                            <h3 className="text-warning">5</h3>
                            <div className="text-muted">Pending Invites</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <Card className="shadow-sm border-0">
                <Card.Body>
                    <h5>Recent Activity</h5>
                    <p className="text-muted">No recent activity to display.</p>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Overview;
