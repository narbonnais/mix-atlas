import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'collector'))
from build_annual import original_track
from normalize_annual_alternatives import normalize_mixes, entry


class AnnualCollectionTests(unittest.TestCase):
    def test_only_original_credits_qualify(self):
        self.assertTrue(original_track('Martinou','Solid Core'))
        self.assertTrue(original_track('Artist','Track (Original Mix)'))
        for artist,title in [('Jeremy Olander','Steps'),('Solange','Losing You (Jeremy Olander Edit)'),
                             ('The Killers','Mr. Brightside (Jacques Lu Cont Thin White Duke Mix)'),
                             ('Jay Tripwire','Dema (Delano Smith Transit Dub)'),('Artist','Track (Remix)')]:
            self.assertFalse(original_track(artist,title))
        self.assertFalse(original_track('Artist','ID','unresolved'))

    def test_ellipses_interrupt_adjacency_without_inventing_tracks(self):
        raw={'pageTitle':'2026-01-01 - Producer - Mix','url':'https://example.com/mix','players':[],
             'fileDetails':'','blocks':[{'text':'[00] Artist - A\n...\n[20] Artist - B\n[25] ?'}]}
        item=normalize_mixes(raw)
        self.assertEqual(len(item['entries']),3)
        self.assertTrue(item['entries'][1]['breakBefore'])
        self.assertEqual(item['entries'][1]['timeSeconds'],1200)
        self.assertEqual(item['entries'][2]['status'],'unresolved')

    def test_publisher_version_annotations_and_unreleased_titles_survive(self):
        row=entry(1,'Hot Chip - Ready For The Floor [Mella Dee Dub]',strip_label=False)
        self.assertEqual(row['title'],'Ready For The Floor [Mella Dee Dub]')
        self.assertEqual(entry(2,'Sebra Cruz - Unreleased')['status'],'unresolved')


if __name__=='__main__':unittest.main()
