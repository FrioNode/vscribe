# test_transcriber.py
import sys
import time
sys.path.insert(0, 'api/services')

from transcriber import VideoTranscriber, TranscriptionType, JobStatus

def progress_callback(status, percent):
    """Show progress during transcription"""
    print(f"  [{status.value}] {percent}%")

def test_transcriber():
    print("=" * 60)
    print("TESTING VideoTranscriber WITH FILE CACHE")
    print("=" * 60)
    
    # Initialize
    print("\n1. Creating transcriber instance...")
    transcriber = VideoTranscriber(
        model_size="base",
        cache_max_age_days=7,
        cache_max_files=100
    )
    print("   ✅ Transcriber created")
    print(f"   Cache dir: {transcriber.cache_dir}")
    
    # Get URL
    url = input("\n2. Enter video URL: ").strip()
    
    # ============ RUN 1: Word by Word (First Time) ============
    print("\n3. RUN 1: Word-by-word (first time, should be SLOW)")
    print("   " + "-" * 40)
    start = time.time()
    result1 = transcriber.transcribe(
        source=url,
        transcription_type=TranscriptionType.WORD_BY_WORD,
        is_url=True,
        progress_callback=progress_callback
    )
    time1 = time.time() - start
    
    if result1.error:
        print(f"   ❌ Failed: {result1.error}")
    else:
        print(f"   ✅ Success!")
        print(f"   ⏱️  Time: {time1:.1f}s")
        print(f"   Language: {result1.language}")
        print(f"   Duration: {result1.duration:.1f}s")
        print(f"   Text preview: {result1.full_text[:100]}...")
    
    # ============ RUN 2: Word by Word (CACHED!) ============
    print(f"\n4. RUN 2: Word-by-word AGAIN (should be INSTANT from cache!)")
    print("   " + "-" * 40)
    start = time.time()
    result2 = transcriber.transcribe(
        source=url,
        transcription_type=TranscriptionType.WORD_BY_WORD,
        is_url=True,
        progress_callback=progress_callback
    )
    time2 = time.time() - start
    
    if result2.error:
        print(f"   ❌ Failed: {result2.error}")
    else:
        print(f"   ✅ Success!")
        print(f"   ⏱️  Time: {time2:.4f}s")
        if time2 < 0.1:
            print(f"   🚀 CACHE HIT! Loaded from disk in {time2*1000:.1f}ms!")
        else:
            print(f"   ⚠️  Cache miss - still slow")
    
    # ============ RUN 3: Timeline (First Time) ============
    print(f"\n5. RUN 3: Timeline (different format, should be SLOW)")
    print("   " + "-" * 40)
    start = time.time()
    result3 = transcriber.transcribe(
        source=url,
        transcription_type=TranscriptionType.TIMELINE,
        is_url=True,
        progress_callback=progress_callback
    )
    time3 = time.time() - start
    
    if result3.error:
        print(f"   ❌ Failed: {result3.error}")
    else:
        print(f"   ✅ Success!")
        print(f"   ⏱️  Time: {time3:.1f}s")
        print(f"   Segments: {len(result3.segments)}")
        print(f"   First segment: [{result3.segments[0].start:.1f}s] {result3.segments[0].text[:80]}...")
    
    # ============ RUN 4: Timeline (CACHED!) ============
    print(f"\n6. RUN 4: Timeline AGAIN (should be INSTANT from cache!)")
    print("   " + "-" * 40)
    start = time.time()
    result4 = transcriber.transcribe(
        source=url,
        transcription_type=TranscriptionType.TIMELINE,
        is_url=True,
        progress_callback=progress_callback
    )
    time4 = time.time() - start
    
    if result4.error:
        print(f"   ❌ Failed: {result4.error}")
    else:
        print(f"   ✅ Success!")
        print(f"   ⏱️  Time: {time4:.4f}s")
        if time4 < 0.1:
            print(f"   🚀 CACHE HIT! Loaded from disk in {time4*1000:.1f}ms!")
        else:
            print(f"   ⚠️  Cache miss - still slow")
    
    # ============ CACHE STATS ============
    print(f"\n7. Cache Stats:")
    print("   " + "-" * 40)
    stats = transcriber.get_cache_stats()
    print(f"   Files in cache: {stats['file_count']}")
    print(f"   Total size: {stats['total_size_mb']} MB")
    print(f"   Max files: {stats['max_files']}")
    print(f"   Max age: {stats['max_age_days']} days")
    
    # ============ SUMMARY ============
    print("\n" + "=" * 60)
    print("SUMMARY:")
    print("=" * 60)
    print(f"  Run 1 (word-by-word, first):   {time1:.1f}s")
    print(f"  Run 2 (word-by-word, cached):   {time2:.4f}s {'🚀' if time2 < 0.1 else '⚠️'}")
    print(f"  Run 3 (timeline, first):        {time3:.1f}s")
    print(f"  Run 4 (timeline, cached):        {time4:.4f}s {'🚀' if time4 < 0.1 else '⚠️'}")
    
    speedup1 = time1 / time2 if time2 > 0 else 0
    speedup2 = time3 / time4 if time4 > 0 else 0
    print(f"\n  Cache speedup (word):           {speedup1:.0f}x faster!")
    print(f"  Cache speedup (timeline):        {speedup2:.0f}x faster!")
    print("\n✅ ALL TESTS PASSED!" if not result1.error else "❌ SOME TESTS FAILED")
    print("=" * 60)

if __name__ == "__main__":
    test_transcriber()