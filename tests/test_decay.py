import pytest
from datetime import datetime, timedelta, timezone
from app.ml.decay import decayed_score, classify_status, LAMBDA
from app.config import settings

def test_decayed_score_no_time_passed():
    """Test that base score does not decay if zero time has passed."""
    now = datetime.now(timezone.utc)
    base_score = 0.90
    
    score = decayed_score(
        base_score=base_score, 
        submitted_at_iso=now.isoformat(), 
        now=now
    )
    
    assert score == base_score

def test_decayed_score_half_life():
    """Test that base score halves after exactly one half-life period."""
    now = datetime.now(timezone.utc)
    submitted_at = now - timedelta(hours=settings.HALF_LIFE_HOURS)
    base_score = 0.80
    
    score = decayed_score(
        base_score=base_score,
        submitted_at_iso=submitted_at.isoformat(),
        now=now
    )
    
    # It should be roughly exactly half the base score
    assert pytest.approx(score, 0.01) == base_score / 2

def test_decayed_score_already_contacted():
    """Test that decay freezes if the lead is already contacted."""
    now = datetime.now(timezone.utc)
    submitted_at = now - timedelta(hours=48)
    base_score = 0.95
    frozen = 0.85
    
    score = decayed_score(
        base_score=base_score,
        submitted_at_iso=submitted_at.isoformat(),
        contacted=True,
        frozen_score=frozen,
        now=now
    )
    
    assert score == frozen

def test_classify_status_hot():
    """Test threshold for hot leads."""
    assert classify_status(settings.HOT_THRESHOLD) == "hot"
    assert classify_status(99.0) == "hot"

def test_classify_status_cold():
    """Test threshold for cold leads."""
    assert classify_status(0.0) == "cold"
    assert classify_status(settings.WARM_THRESHOLD - 0.01) == "cold"
