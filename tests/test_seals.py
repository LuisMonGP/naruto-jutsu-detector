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
    # Tigre unimanual: índice extendido erguido, pulgar y dedos restantes plegados
    angulos = {
        "thumb": 90.0,
        "index": 170.0,
        "middle": 80.0,
        "ring": 70.0,
        "pinky": 65.0,
    }
    sello, conf = classifier.clasificar(angulos)
    assert sello == "TORA"
    assert conf >= 0.80


def test_clasificacion_sello_jabali():
    classifier = SealClassifier()
    angulos_cerrados = {"thumb": 80.0, "index": 70.0, "middle": 65.0, "ring": 60.0, "pinky": 55.0}
    sello, conf = classifier.clasificar(angulos_cerrados, angulos_cerrados, distancia_manos=0.20)
    assert sello == "I"
    assert conf >= 0.85


def test_clasificacion_sello_perro():
    classifier = SealClassifier()
    mano_abierta = {"thumb": 150.0, "index": 160.0, "middle": 160.0, "ring": 155.0, "pinky": 150.0}
    mano_cerrada = {"thumb": 80.0, "index": 70.0, "middle": 65.0, "ring": 60.0, "pinky": 55.0}
    sello, conf = classifier.clasificar(mano_abierta, mano_cerrada, distancia_manos=0.25)
    assert sello == "INU"
    assert conf >= 0.85


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


def test_clasificacion_sello_pajaro():
    classifier = SealClassifier()
    angulos = {"thumb": 150.0, "index": 90.0, "middle": 80.0, "ring": 80.0, "pinky": 140.0}
    sello, conf = classifier.clasificar(angulos, angulos, distancia_manos=0.25)
    assert sello == "TORI"
    assert conf >= 0.85


def test_clasificacion_sello_liebre():
    classifier = SealClassifier()
    # Pistola unimanual: pulgar e índice extendidos, demás cerrados
    angulos = {"thumb": 155.0, "index": 160.0, "middle": 75.0, "ring": 70.0, "pinky": 65.0}
    sello, conf = classifier.clasificar(angulos)
    assert sello == "U"
    assert conf >= 0.85


def test_clasificacion_sello_kage_bunshin():
    classifier = SealClassifier()
    mano = {"thumb": 90.0, "index": 150.0, "middle": 80.0, "ring": 80.0, "pinky": 70.0}
    sello, conf = classifier.clasificar(mano, mano, distancia_manos=0.20)
    assert sello == "KAGE_BUNSHIN_CROSS"
    assert conf >= 0.90

