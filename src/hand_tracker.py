"""Motor de Detección y Normalización Geométrica de Puntos Clave de Manos (MediaPipe)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
import numpy as np


class HandTracker:
    """Rastreador de articulaciones de manos basado en MediaPipe Hands con normalización invariante."""

    def __init__(self, max_hands: int = 2, min_detection_confidence: float = 0.7) -> None:
        self.max_hands = max_hands
        self.min_detection_confidence = min_detection_confidence
        self._mp_hands = None
        self._hands = None

        try:
            import mediapipe as mp
            self._mp_hands = mp.solutions.hands
            self._hands = self._mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=max_hands,
                min_detection_confidence=min_detection_confidence,
                min_tracking_confidence=0.5,
            )
        except Exception:
            self._hands = None

    def normalizar_landmarks(self, landmarks_3d: np.ndarray) -> np.ndarray:
        """Normaliza los 21 puntos respecto a la muñeca (landmark 0) y escala por la longitud de la palma.

        Args:
            landmarks_3d: Arreglo de dimensiones (21, 3).

        Returns:
            np.ndarray: Puntos invariantes a la distancia a la cámara y traslación.
        """
        if landmarks_3d.shape != (21, 3):
            raise ValueError(f"Se esperaban dimensiones (21, 3), recibido {landmarks_3d.shape}")

        origen = landmarks_3d[0]
        centrados = landmarks_3d - origen

        dist_ref = np.linalg.norm(landmarks_3d[9] - landmarks_3d[0])
        if dist_ref < 1e-6:
            dist_ref = 1.0

        return centrados / dist_ref

    def calcular_angulos_dedos(self, landmarks_3d: np.ndarray) -> Dict[str, float]:
        """Calcula el ángulo de extensión de cada dedo en grados.

        Args:
            landmarks_3d: Arreglo (21, 3).

        Returns:
            Dict con los ángulos de los 5 dedos: 'thumb', 'index', 'middle', 'ring', 'pinky'.
        """
        dedos_indices = {
            "thumb": (1, 2, 4),
            "index": (5, 6, 8),
            "middle": (9, 10, 12),
            "ring": (13, 14, 16),
            "pinky": (17, 18, 20),
        }

        angulos = {}
        for dedo, (p1, p2, p3) in dedos_indices.items():
            v1 = landmarks_3d[p1] - landmarks_3d[p2]
            v2 = landmarks_3d[p3] - landmarks_3d[p2]

            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)

            if norm1 * norm2 < 1e-6:
                angulos[dedo] = 0.0
                continue

            cos_theta = np.dot(v1, v2) / (norm1 * norm2)
            cos_theta = np.clip(cos_theta, -1.0, 1.0)
            angulos[dedo] = float(np.degrees(np.arccos(cos_theta)))

        return angulos

    def calcular_orientacion(self, landmarks_3d: np.ndarray) -> str:
        """Determina la orientación espacial de la mano ('UPRIGHT', 'HORIZONTAL' o 'DOWN').

        En el sistema de coordenadas de MediaPipe, Y=0 está arriba y Y=1 abajo.
        Por tanto, un vector de muñeca a nudillo con dy < 0 apunta hacia arriba (cielo/pecho).

        Args:
            landmarks_3d: Arreglo (21, 3).

        Returns:
            str: 'UPRIGHT' (vertical erguida), 'HORIZONTAL' (lateral) o 'DOWN' (boca abajo/invertida).
        """
        if landmarks_3d.shape != (21, 3):
            raise ValueError(f"Se esperaban dimensiones (21, 3), recibido {landmarks_3d.shape}")

        # Vector principal: muñeca (0) -> base del dedo medio (9)
        dx = float(landmarks_3d[9, 0] - landmarks_3d[0, 0])
        dy = float(landmarks_3d[9, 1] - landmarks_3d[0, 1])

        norm = np.hypot(dx, dy)
        if norm < 1e-6:
            return "UPRIGHT"

        angulo_grados = float(np.degrees(np.arctan2(dy, dx)))

        # Apuntando al cielo (-90° es estrictamente hacia arriba en coordenadas de pantalla)
        if -140.0 <= angulo_grados <= -40.0:
            return "UPRIGHT"

        # Apuntando al suelo (+90° es estrictamente hacia abajo)
        if 40.0 <= angulo_grados <= 140.0:
            return "DOWN"

        # Predominio horizontal (lateral)
        return "HORIZONTAL"

