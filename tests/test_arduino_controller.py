import unittest
from arduino_controller import ArduinoController


class TestArduinoController(unittest.TestCase):
    def setUp(self):
        self.controller = ArduinoController(mode="mock")

    def test_connect_mock_mode(self):
        self.controller.connect()

        self.assertTrue(self.controller.connected)

    def test_send_phone_detected(self):
        self.controller.connect()
        self.controller.send_command("PHONE_DETECTED")

        self.assertEqual(
            self.controller.commands_sent,
            ["PHONE_DETECTED"],
        )

    def test_send_phone_clear(self):
        self.controller.connect()
        self.controller.send_command("PHONE_CLEAR")

        self.assertEqual(
            self.controller.commands_sent,
            ["PHONE_CLEAR"],
        )

    def test_reject_invalid_command(self):
        with self.assertRaises(ValueError):
            self.controller.send_command("UNKNOWN_COMMAND")

    def test_reject_command_before_connect(self):
        with self.assertRaises(RuntimeError):
            self.controller.send_command("PHONE_DETECTED")


if __name__ == "__main__":
    unittest.main()
