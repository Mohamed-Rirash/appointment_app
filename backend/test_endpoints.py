#!/usr/bin/env python3
"""
Test script to verify all office endpoints are working correctly
"""

import asyncio

from databases import Database

from app.config import get_settings
from app.office_mgnt.crud import OfficeMembershipMgmtCRUD, OfficeMgmtCRUD
from app.office_mgnt.services import (
    EnhancedOfficeService,
    HostAssignmentService,
    OfficeSearchService,
    OfficeStatsService,
)

settings = get_settings()


async def test_endpoints():
    """Test all endpoints"""
    # Connect to database
    database = Database(settings.DATABASE_URL)
    await database.connect()

    try:
        print("=" * 80)
        print("TESTING OFFICE ENDPOINTS")
        print("=" * 80)

        # Test 1: Get all offices
        print("\n1. Testing: GET /api/v1/offices/stats/all")
        try:
            all_offices = await OfficeMgmtCRUD.get_all(database)
            if all_offices:
                print(f"   ✓ Found {len(all_offices)} offices")

                # Test stats for first office
                office_id = all_offices[0]["id"]
                print(f"\n2. Testing: GET /api/v1/offices/{office_id}/stats")
                stats = await OfficeStatsService.get_office_stats(database, office_id)
                print(f"   ✓ Office: {stats.office_name}")
                print(f"   ✓ Total Members: {stats.total_members}")
                print(f"   ✓ Active Members: {stats.active_members}")
                print(f"   ✓ Total Hosts: {stats.total_hosts}")
                print(f"   ✓ Active Hosts: {stats.active_hosts}")

                # Test all stats
                print("\n3. Testing: GET /api/v1/offices/stats/all")
                all_stats = await OfficeStatsService.get_all_office_stats(database)
                print(f"   ✓ Retrieved stats for {len(all_stats)} offices")

                # Test search offices
                print("\n4. Testing: GET /api/v1/offices/search?query=test")
                search_results = await OfficeSearchService.search_offices_by_name_or_description(
                    database, "test"
                )
                print(f"   ✓ Search returned {len(search_results)} results")

                # Test search hosts by name
                print("\n5. Testing: GET /api/v1/offices/search/hosts?search=test")
                host_results = await OfficeSearchService.search_by_host_name(database, "test")
                print(f"   ✓ Host search returned {len(host_results)} results")

                # Test search by office
                print("\n6. Testing: GET /api/v1/offices/search/by-office?search=test")
                office_search = await OfficeSearchService.search_by_office_name(database, "test")
                print(f"   ✓ Office search returned {len(office_search)} results")

                # Test search by position
                print("\n7. Testing: GET /api/v1/offices/search/by-position?position=test")
                position_results = await OfficeSearchService.search_by_position(database, "test")
                print(f"   ✓ Position search returned {len(position_results)} results")

                # Test user host status
                print("\n8. Testing: GET /api/v1/offices/users/{user_id}/host-status")
                # Get a user from the first office
                members = await OfficeMembershipMgmtCRUD.get_members_by_office(database, office_id)
                if members:
                    user_id = members[0]["user_id"]
                    assignments = await HostAssignmentService.get_host_assignments(
                        database, host_id=user_id
                    )
                    all_offices_list = await EnhancedOfficeService.get_all_offices(database)
                    active_offices = [o for o in all_offices_list if o.is_active]
                    assigned_office_ids = {a.office_id for a in assignments}
                    available_offices = [o for o in active_offices if o.id not in assigned_office_ids]
                    print(f"   ✓ User {user_id} is host in {len(assignments)} offices")
                    print(f"   ✓ User has {len(available_offices)} available offices")
                else:
                    print("   ⚠ No members found in office")
            else:
                print("   ⚠ No offices found in database")

        except Exception as e:
            print(f"   ✗ Error: {e!s}")
            import traceback
            traceback.print_exc()

        print("\n" + "=" * 80)
        print("ALL TESTS COMPLETED")
        print("=" * 80)

    finally:
        await database.disconnect()


if __name__ == "__main__":
    asyncio.run(test_endpoints())

