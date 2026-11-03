"""Tests unitarios para la máquina de estados y normalización geométrica."""

import numpy as np
import pytest

from src.hand_tracker import HandTracker
from src.seal_classifier import SealClassifier
from src.jutsu_fsm import JutsuFSM


def test_normalizacion_landmarks_unitarios():
    tracker = HandTracker()
    landmarks_mock = np.zeros((21, 3))
    landmarks_mock[9] = np.array([0.0, 1.0, 0.0])  # Distancia de referencia = 1.0

    normalizados = tracker.normalizar_landmarks(landmarks_mock)
    assert normalizados.shape == (21, 3)
    assert np.allclose(normalizados[0], [0.0, 0.0, 0.0])
    assert np.allclose(normalizados[9], [0.0, 1.0, 0.0])


def test_clasificacion_sello_tigre():
    classifier = SealClassifier()
    # Mock dedos: Índice extendido (>150), anular cerrado (<90)
    angulos = {
        "thumb": 160.0,
        "index": 170.0,
        "middle": 80.0,
        "ring": 70.0,
        "pinky": 65.0,
    }
    sello, conf = classifier.clasificar(angulos)
    assert sello == "TORA"
    assert conf >= 0.80


def test_fsm_activacion_katon():
    fsm = JutsuFSM(debounce_frames=1)
    # Secuencia Katon: MI -> HITSUJI -> TORA
    assert fsm.registrar_frame("MI") is None
    assert fsm.registrar_frame("HITSUJI") is None
    jutsu = fsm.registrar_frame("TORA")
    assert jutsu == "KATON_GOUKAKYUU"


def test_fsm_activacion_rasengan():
    fsm = JutsuFSM(debounce_frames=1)
    jutsu = fsm.registrar_frame("OPEN_PALM")
    assert jutsu == "RASENGAN"
