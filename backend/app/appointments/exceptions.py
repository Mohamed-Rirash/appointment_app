# exceptions.py
class AppointmentNotFound(Exception):
    pass


class AppointmentAlreadyApproved(Exception):
    pass


class AppointmentDecisionNotAllowed(Exception):
    pass


class AppointmentCancellationNotAllowed(Exception):
    pass


class AppointmentEditNotAllowed(Exception):
    pass


class AppointmentCompletionNotAllowed(Exception):
    pass


class AppointmentPostponementNotAllowed(Exception):
    pass
