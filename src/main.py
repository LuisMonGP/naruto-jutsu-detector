"""Punto de entrada principal para la ejecución local con OpenCV y Webcam."""

from __future__ import annotations

import sys
import numpy as np

from src.hand_tracker import HandTracker
from src.seal_classifier import SealClassifier
from src.jutsu_fsm import JutsuFSM


def main():
    print("Iniciando Naruto Jutsu Detector (Local Engine)...")
    try:
        import cv2
    except ImportError:
        print("OpenCV no está instalado en el entorno local. Para la experiencia interactiva sin instalar nada, visita la versión web en docs/.")
        return

    cap = cv2.VideoCapture(0)
    tracker = HandTracker()
    classifier = SealClassifier()
    fsm = JutsuFSM()

    print("Cámara iniciada. Presiona 'q' para salir.")
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        # Bucle simulado para visualización local
        cv2.putText(frame, "NARUTO JUTSU DETECTOR - MODO LOCAL", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        cv2.imshow("Naruto Jutsu Detector", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
