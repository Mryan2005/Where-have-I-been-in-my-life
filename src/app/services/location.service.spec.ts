import { TestBed } from '@angular/core/testing';
import { LocationService } from './location.service';
import { TravelLocation } from '../models/location.model';

const MOCK_LOCATION: TravelLocation = {
  id: 'test-1',
  name: '测试地点',
  content: '# 测试\n\n内容。',
  latitude: 39.9,
  longitude: 116.4,
  visitDate: '2024-01-01',
  images: [],
  markerColor: '#E74C3C',
};

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocationService);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load default seed locations when localStorage is empty', () => {
    expect(service.snapshot.length).toBeGreaterThan(0);
  });

  it('should add a location', () => {
    const before = service.snapshot.length;
    service.add(MOCK_LOCATION);
    expect(service.snapshot.length).toBe(before + 1);
  });

  it('should find added location by id', () => {
    service.add(MOCK_LOCATION);
    const found = service.getById('test-1');
    expect(found).toBeDefined();
    expect(found?.name).toBe('测试地点');
  });

  it('should update a location', () => {
    service.add(MOCK_LOCATION);
    service.update({ ...MOCK_LOCATION, name: '已更新' });
    expect(service.getById('test-1')?.name).toBe('已更新');
  });

  it('should remove a location', () => {
    service.add(MOCK_LOCATION);
    service.remove('test-1');
    expect(service.getById('test-1')).toBeUndefined();
  });

  it('should persist to localStorage', () => {
    service.add(MOCK_LOCATION);
    const raw = localStorage.getItem('travel_locations');
    expect(raw).not.toBeNull();
    const parsed: TravelLocation[] = JSON.parse(raw!);
    expect(parsed.some(l => l.id === 'test-1')).toBeTrue();
  });

  it('should emit updated list via locations$', (done) => {
    let emitted = false;
    service.locations$.subscribe(list => {
      if (list.some(l => l.id === 'test-1')) {
        emitted = true;
        expect(emitted).toBeTrue();
        done();
      }
    });
    service.add(MOCK_LOCATION);
  });
});
