# exceptions.py
class AppointmentNotFound(Exception):
    pass


class AppointmentAlreadyApproved(Exception):
    pass


class AppointmentDecisionNotAllowed(Exception):
    pass
