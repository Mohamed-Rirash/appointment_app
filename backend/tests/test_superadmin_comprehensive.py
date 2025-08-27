"""
Comprehensive tests for super admin module functionality
"""
import pytest
from httpx import AsyncClient
from databases import Database
from uuid import UUID, uuid4
from datetime import datetime, timedelta

from app.auth.crud import UserCRUD
from app.auth.rbac import RoleCRUD, RBACCRUD
from app.core.security import hash_password
from app.superadmin.service import SuperAdminSystemService, SuperAdminBackupService, SuperAdminUserService
from app.superadmin.schemas import (
    SystemMaintenanceRequest, DatabaseBackupRequest, AdminPromotionRequest,
    AdminDemotionRequest, SystemRestartRequest
)
from app.superadmin.crud import SuperAdminSystemCRUD, SuperAdminBackupCRUD, SuperAdminSecurityCRUD
from app.superadmin.config import SystemMaintenanceMode, BackupType
from app.superadmin.utils import SystemMonitor, BackupManager, SecurityAnalyzer
from tests.conftest import TestUtils


class TestSuperAdminSystemManagement:
    """Test super admin system management functionality"""
    
    @pytest.mark.asyncio
    async def test_enter_maintenance_mode(self, db_session: Database, super_admin_user: dict):
        """Test entering maintenance mode"""
        
        maintenance_request = SystemMaintenanceRequest(
            mode=SystemMaintenanceMode.MAINTENANCE,
            duration_minutes=60,
            reason="Scheduled system maintenance for security updates",
            notify_users=True
        )
        
        response = await SuperAdminSystemService.enter_maintenance_mode(
            db_session, maintenance_request, super_admin_user["id"]
        )
        
        assert response.mode == SystemMaintenanceMode.MAINTENANCE
        assert response.active is True
        assert response.reason == "Scheduled system maintenance for security updates"
        assert response.initiated_by == super_admin_user["id"]
    
    @pytest.mark.asyncio
    async def test_exit_maintenance_mode(self, db_session: Database, super_admin_user: dict):
        """Test exiting maintenance mode"""
        
        # First enter maintenance mode
        maintenance_request = SystemMaintenanceRequest(
            mode=SystemMaintenanceMode.READ_ONLY,
            reason="Test maintenance",
            notify_users=False
        )
        
        await SuperAdminSystemService.enter_maintenance_mode(
            db_session, maintenance_request, super_admin_user["id"]
        )
        
        # Then exit maintenance mode
        result = await SuperAdminSystemService.exit_maintenance_mode(
            db_session, super_admin_user["id"]
        )
        
        assert result is True
        
        # Verify no active maintenance
        active_maintenance = await SuperAdminSystemCRUD.get_active_maintenance(db_session)
        assert active_maintenance is None
    
    @pytest.mark.asyncio
    async def test_system_restart_request(self, db_session: Database, super_admin_user: dict):
        """Test system restart request"""
        
        restart_request = SystemRestartRequest(
            reason="Apply critical security patches",
            delay_seconds=60,
            notify_users=True,
            force_restart=False
        )
        
        result = await SuperAdminSystemService.restart_system(
            db_session, restart_request, super_admin_user["id"]
        )
        
        assert result["operation"] == "system_restart"
        assert result["delay_seconds"] == 60
        assert result["reason"] == "Apply critical security patches"
        assert result["initiated_by"] == str(super_admin_user["id"])
    
    @pytest.mark.asyncio
    async def test_get_system_health(self, db_session: Database):
        """Test system health report generation"""
        
        health_report = await SuperAdminSystemService.get_system_health(db_session)
        
        assert hasattr(health_report, 'overall_status')
        assert hasattr(health_report, 'components')
        assert hasattr(health_report, 'recommendations')
        assert isinstance(health_report.recommendations, list)
        assert len(health_report.recommendations) > 0


class TestSuperAdminBackupManagement:
    """Test super admin backup management functionality"""
    
    @pytest.mark.asyncio
    async def test_create_database_backup(self, db_session: Database, super_admin_user: dict):
        """Test database backup creation"""
        
        backup_request = DatabaseBackupRequest(
            backup_type=BackupType.FULL,
            description="Weekly full backup",
            compress=True,
            encrypt=True,
            include_logs=False,
            retention_days=30
        )
        
        response = await SuperAdminBackupService.create_database_backup(
            db_session, backup_request, super_admin_user["id"]
        )
        
        assert response.backup_type == BackupType.FULL
        assert response.status == "pending"
        assert response.progress_percentage == 0.0
        assert isinstance(response.backup_id, UUID)
    
    @pytest.mark.asyncio
    async def test_backup_progress_tracking(self, db_session: Database, super_admin_user: dict):
        """Test backup progress tracking"""
        
        # Create backup record
        backup_request = DatabaseBackupRequest(
            backup_type=BackupType.INCREMENTAL,
            description="Test backup for progress tracking"
        )
        
        backup_record = await SuperAdminBackupCRUD.create_backup_record(
            db_session, backup_request, super_admin_user["id"]
        )
        
        # Update progress
        result = await SuperAdminBackupCRUD.update_backup_progress(
            db_session, backup_record["id"], 50.0, "running"
        )
        
        assert result is True
        
        # Get updated record
        updated_backup = await SuperAdminBackupCRUD.get_backup_by_id(
            db_session, backup_record["id"]
        )
        
        assert updated_backup["progress_percentage"] == 50.0
        assert updated_backup["status"] == "running"
    
    @pytest.mark.asyncio
    async def test_complete_backup(self, db_session: Database, super_admin_user: dict):
        """Test backup completion"""
        
        # Create backup record
        backup_request = DatabaseBackupRequest(
            backup_type=BackupType.DIFFERENTIAL,
            description="Test backup completion"
        )
        
        backup_record = await SuperAdminBackupCRUD.create_backup_record(
            db_session, backup_request, super_admin_user["id"]
        )
        
        # Complete backup
        result = await SuperAdminBackupCRUD.complete_backup(
            db_session, backup_record["id"], "/backups/test.sql", 1024000, "abc123"
        )
        
        assert result is True
        
        # Verify completion
        completed_backup = await SuperAdminBackupCRUD.get_backup_by_id(
            db_session, backup_record["id"]
        )
        
        assert completed_backup["status"] == "completed"
        assert completed_backup["progress_percentage"] == 100.0
        assert completed_backup["file_path"] == "/backups/test.sql"
        assert completed_backup["checksum"] == "abc123"


class TestSuperAdminUserManagement:
    """Test super admin user management functionality"""
    
    @pytest.mark.asyncio
    async def test_promote_user_to_admin(self, db_session: Database, test_user: dict, super_admin_user: dict):
        """Test promoting user to admin"""
        
        # Create admin role if it doesn't exist
        admin_role = await RoleCRUD.get_by_name(db_session, "admin")
        if not admin_role:
            admin_role = await RoleCRUD.create(db_session, {
                "name": "admin",
                "display_name": "Administrator",
                "description": "System administrator role",
                "is_active": True,
                "is_system": False
            }, super_admin_user["id"])
        
        promotion_request = AdminPromotionRequest(
            user_id=test_user["id"],
            admin_level="admin",
            reason="Promoting user for administrative duties",
            notify_user=True,
            temporary=False
        )
        
        result = await SuperAdminUserService.promote_user_to_admin(
            db_session, promotion_request, super_admin_user["id"]
        )
        
        assert result["user_id"] == test_user["id"]
        assert result["promoted_to"] == "admin"
        assert result["reason"] == "Promoting user for administrative duties"
        
        # Verify role assignment
        user_roles = await RBACCRUD.get_user_roles(db_session, test_user["id"])
        role_names = [role["name"] for role in user_roles]
        assert "admin" in role_names
    
    @pytest.mark.asyncio
    async def test_demote_admin_user(self, db_session: Database, super_admin_user: dict):
        """Test demoting admin user"""
        
        # Create a test admin user
        admin_user_data = {
            "first_name": "Test",
            "last_name": "Admin",
            "email": "test.admin.demote@gmail.com",
            "password": await hash_password("AdminPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": False
        }
        
        admin_user = await UserCRUD.create(db_session, admin_user_data)
        
        # Assign admin role
        admin_role = await RoleCRUD.get_by_name(db_session, "admin")
        if admin_role:
            await RBACCRUD.assign_role_to_user(
                db_session, admin_user["id"], admin_role["id"], super_admin_user["id"]
            )
        
        # Demote admin
        demotion_request = AdminDemotionRequest(
            admin_id=admin_user["id"],
            reason="Administrative restructuring",
            revoke_all_permissions=True,
            notify_user=True
        )
        
        result = await SuperAdminUserService.demote_admin_user(
            db_session, demotion_request, super_admin_user["id"]
        )
        
        assert result["admin_id"] == admin_user["id"]
        assert "admin" in result["roles_removed"]
        
        # Verify role removal
        user_roles = await RBACCRUD.get_user_roles(db_session, admin_user["id"])
        role_names = [role["name"] for role in user_roles]
        assert "admin" not in role_names


class TestSuperAdminSecurity:
    """Test super admin security functionality"""
    
    @pytest.mark.asyncio
    async def test_create_threat_alert(self, db_session: Database):
        """Test threat alert creation"""
        
        alert_id = await SuperAdminSecurityCRUD.create_threat_alert(
            db=db_session,
            alert_type="brute_force",
            threat_type="authentication",
            severity="high",
            title="Brute Force Attack Detected",
            description="Multiple failed login attempts from suspicious IP",
            source_ip="192.168.1.100",
            target_resource="login_endpoint",
            confidence_score=0.85
        )
        
        assert isinstance(alert_id, UUID)
        
        # Verify alert was created
        active_threats = await SuperAdminSecurityCRUD.get_active_threats(db_session)
        assert len(active_threats) > 0
        
        created_alert = next(
            (alert for alert in active_threats if alert["id"] == alert_id), None
        )
        assert created_alert is not None
        assert created_alert["severity"] == "high"
        assert created_alert["source_ip"] == "192.168.1.100"
    
    @pytest.mark.asyncio
    async def test_create_security_incident(self, db_session: Database, super_admin_user: dict):
        """Test security incident creation"""
        
        incident_id = await SuperAdminSecurityCRUD.create_incident(
            db=db_session,
            incident_type="data_breach",
            severity="critical",
            title="Potential Data Breach",
            description="Unauthorized access attempt detected",
            affected_systems=["user_database", "authentication_service"],
            created_by=super_admin_user["id"]
        )
        
        assert isinstance(incident_id, UUID)
        
        # Verify incident was created
        active_incidents = await SuperAdminSecurityCRUD.get_active_incidents(db_session)
        assert len(active_incidents) > 0
        
        created_incident = next(
            (incident for incident in active_incidents if incident["id"] == incident_id), None
        )
        assert created_incident is not None
        assert created_incident["severity"] == "critical"
        assert "user_database" in created_incident["affected_systems"]


class TestSuperAdminUtilities:
    """Test super admin utility functions"""
    
    def test_system_monitor_metrics(self):
        """Test system monitoring metrics collection"""
        
        metrics = SystemMonitor.get_system_metrics()
        
        # Check that basic metrics are present
        expected_keys = ["cpu_usage", "memory_usage", "disk_usage", "timestamp"]
        for key in expected_keys:
            assert key in metrics
        
        # Check that values are reasonable
        if "error" not in metrics:
            assert 0 <= metrics["cpu_usage"] <= 100
            assert 0 <= metrics["memory_usage"] <= 100
            assert 0 <= metrics["disk_usage"] <= 100
    
    def test_backup_filename_generation(self):
        """Test backup filename generation"""
        
        test_time = datetime(2024, 1, 15, 14, 30, 0)
        filename = BackupManager.create_backup_filename("full", test_time)
        
        assert filename == "backup_full_20240115_143000.sql"
        assert filename.startswith("backup_")
        assert filename.endswith(".sql")
    
    def test_security_analyzer_login_patterns(self):
        """Test security analyzer login pattern analysis"""
        
        login_data = [
            {"ip_address": "192.168.1.1", "success": True, "user_agent": "Mozilla/5.0"},
            {"ip_address": "192.168.1.1", "success": False, "user_agent": "Mozilla/5.0"},
            {"ip_address": "192.168.1.2", "success": True, "user_agent": "bot"},
            {"ip_address": "192.168.1.3", "success": False, "user_agent": "Mozilla/5.0"},
        ]
        
        analysis = SecurityAnalyzer.analyze_login_patterns(login_data)
        
        assert analysis["total_logins"] == 4
        assert analysis["unique_ips"] == 3
        assert analysis["failed_attempts"] == 2
        assert analysis["failed_login_rate"] == 50.0
        assert len(analysis["suspicious_patterns"]) == 1
    
    def test_brute_force_detection(self):
        """Test brute force attack detection"""
        
        # Create multiple failed attempts from same IP
        login_attempts = []
        for i in range(15):
            login_attempts.append({
                "ip_address": "192.168.1.100",
                "success": False,
                "timestamp": f"2024-01-15T10:{i:02d}:00"
            })
        
        brute_force_attempts = SecurityAnalyzer.detect_brute_force_attempts(
            login_attempts, threshold=10
        )
        
        assert len(brute_force_attempts) == 1
        assert brute_force_attempts[0]["ip_address"] == "192.168.1.100"
        assert brute_force_attempts[0]["attempt_count"] == 15
        assert brute_force_attempts[0]["severity"] == "high"


class TestSuperAdminAPIEndpoints:
    """Test super admin API endpoints"""
    
    @pytest.mark.asyncio
    async def test_super_admin_dashboard_endpoint(self, client: AsyncClient, super_admin_auth_headers: dict):
        """Test super admin dashboard endpoint"""
        
        response = await client.get(
            "/api/v1/superadmin/dashboard",
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "system_status" in data
        assert "system_metrics" in data
        assert "quick_actions" in data
        assert isinstance(data["quick_actions"], list)
        assert len(data["quick_actions"]) > 0
    
    @pytest.mark.asyncio
    async def test_maintenance_mode_endpoints(self, client: AsyncClient, super_admin_auth_headers: dict):
        """Test maintenance mode endpoints"""
        
        # Enter maintenance mode
        maintenance_data = {
            "mode": "maintenance",
            "duration_minutes": 30,
            "reason": "Scheduled maintenance for testing",
            "notify_users": True
        }
        
        response = await client.post(
            "/api/v1/superadmin/system/maintenance",
            json=maintenance_data,
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "maintenance"
        assert data["active"] is True
        
        # Exit maintenance mode
        response = await client.delete(
            "/api/v1/superadmin/system/maintenance",
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    @pytest.mark.asyncio
    async def test_database_backup_endpoint(self, client: AsyncClient, super_admin_auth_headers: dict):
        """Test database backup endpoint"""
        
        backup_data = {
            "backup_type": "full",
            "description": "API test backup",
            "compress": True,
            "encrypt": True,
            "include_logs": False
        }
        
        response = await client.post(
            "/api/v1/superadmin/database/backup",
            json=backup_data,
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["backup_type"] == "full"
        assert data["status"] == "pending"
        assert "backup_id" in data
    
    @pytest.mark.asyncio
    async def test_system_health_endpoint(self, client: AsyncClient, super_admin_auth_headers: dict):
        """Test system health endpoint"""
        
        response = await client.get(
            "/api/v1/superadmin/system/health",
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "overall_status" in data
        assert "components" in data
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)
    
    @pytest.mark.asyncio
    async def test_unauthorized_access(self, client: AsyncClient, user_auth_headers: dict):
        """Test that regular users cannot access super admin endpoints"""
        
        response = await client.get(
            "/api/v1/superadmin/dashboard",
            headers=user_auth_headers
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "Super admin access required" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_critical_operation_confirmation(self, client: AsyncClient, super_admin_auth_headers: dict):
        """Test that critical operations require confirmation"""
        
        restart_data = {
            "reason": "Test restart",
            "delay_seconds": 60,
            "notify_users": True,
            "force_restart": False
        }
        
        # Without confirmation header
        response = await client.post(
            "/api/v1/superadmin/system/restart",
            json=restart_data,
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 400
        assert "confirmation header" in response.json()["detail"]
        
        # With confirmation header
        headers_with_confirmation = {
            **super_admin_auth_headers,
            "X-Confirm-Operation": "true"
        }
        
        response = await client.post(
            "/api/v1/superadmin/system/restart",
            json=restart_data,
            headers=headers_with_confirmation
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
