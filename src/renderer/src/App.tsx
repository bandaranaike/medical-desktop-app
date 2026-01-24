import React, { useEffect, useState } from 'react'

interface PatientInfo {
  telephone: string
  name: string
  age: string
  address: string
  registrationNo: string
  gender: string
}

interface UserRecord {
  id: number
  name: string
  email: string
  // Add other fields if they exist in DB and we want to autofill them
  telephone?: string
  age?: string
  address?: string
  registrationNo?: string
  gender?: string
}

interface Service {
  id: string
  name: string
  price: number
  selected: boolean
}

function App(): React.JSX.Element {
  const [patient, setPatient] = useState<PatientInfo>({
    telephone: '',
    name: '',
    age: '',
    address: '',
    registrationNo: '',
    gender: 'Male'
  })

  const [services, setServices] = useState<Service[]>([
    { id: '1', name: 'Blood Test', price: 500, selected: false },
    { id: '2', name: 'X-Ray', price: 1200, selected: false },
    { id: '3', name: 'Consultation', price: 800, selected: false },
    { id: '4', name: 'ECG', price: 1500, selected: false },
    { id: '5', name: 'Urine Test', price: 300, selected: false },
    { id: '6', name: 'MRI Scan', price: 5000, selected: false }
  ])

  const [doctorChannel, setDoctorChannel] = useState({
    name: '',
    price: 2400
  })

  const [history, setHistory] = useState<string[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const [searchResults, setSearchResults] = useState<UserRecord[]>([])
  const [activeField, setActiveField] = useState<string | null>(null)

  useEffect(() => {
    const handleSearch = async (): Promise<void> => {
      const query = activeField ? patient[activeField as keyof PatientInfo] : ''
      if (query && query.length > 1) {
        try {
          const results = await window.api.searchUsers(query)
          console.log('Search results:', results)
          setSearchResults(results as unknown as UserRecord[])
        } catch (error) {
          console.error('Failed to search users:', error)
          setSearchResults([])
        }
      } else {
        setSearchResults([])
      }
    }

    const timer = setTimeout(() => {
      handleSearch()
    }, 300)

    return () => clearTimeout(timer)
  }, [patient.telephone, patient.name, patient.registrationNo, activeField, patient])

  const selectUser = (user: UserRecord): void => {
    setPatient({
      telephone: user.telephone || '',
      name: user.name || '',
      age: user.age || '',
      address: user.address || '',
      registrationNo: user.registrationNo || '',
      gender: user.gender || 'Male'
    })
    setSearchResults([])
    setActiveField(null)
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    if (patient.telephone && patient.name) {
      // Simulating loading history once telephone and name are entered
      timeoutId = setTimeout(() => {
        setHistory(['Last visit: 2025-12-10 - Fever', 'Visited Dr. Smith - General Checkup'])
        setIsLoadingHistory(false)
      }, 1000)
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [patient.telephone, patient.name])

  const handlePatientChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target
    setPatient((prev) => {
      const newState = { ...prev, [name]: value }
      if (name === 'telephone' || name === 'name') {
        if (newState.telephone && newState.name) {
          setIsLoadingHistory(true)
        }
      }
      return newState
    })
  }

  const toggleService = (id: string): void => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)))
  }

  const total =
    services.reduce((acc, s) => (s.selected ? acc + s.price : acc), 0) +
    (doctorChannel.name ? doctorChannel.price : 0)

  return (
    <div className="container">
      {/* Row 1 */}
      <div className="row">
        <div className="col-3-4">
          <div className="form-group">
            <label>Telephone</label>
            <input
              name="telephone"
              value={patient.telephone}
              onChange={handlePatientChange}
              onFocus={() => setActiveField('telephone')}
              onBlur={() => setTimeout(() => setActiveField(null), 200)}
              placeholder="Telephone"
            />
            {activeField === 'telephone' && searchResults.length > 0 && (
              <ul className="autofill-dropdown">
                {searchResults.map((user) => (
                  <li key={user.id} className="autofill-item" onClick={() => selectUser(user)}>
                    <span className="name">{user.name}</span>
                    <span className="info">{user.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="form-group">
            <label>Name</label>
            <input
              name="name"
              value={patient.name}
              onChange={handlePatientChange}
              onFocus={() => setActiveField('name')}
              onBlur={() => setTimeout(() => setActiveField(null), 200)}
              placeholder="Patient Name"
            />
            {activeField === 'name' && searchResults.length > 0 && (
              <ul className="autofill-dropdown">
                {searchResults.map((user) => (
                  <li key={user.id} className="autofill-item" onClick={() => selectUser(user)}>
                    <span className="name">{user.name}</span>
                    <span className="info">{user.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="form-group">
            <label>Age</label>
            <input
              name="age"
              value={patient.age}
              onChange={handlePatientChange}
              placeholder="Age"
            />
          </div>
          <div className="form-group">
            <label>Registration No</label>
            <input
              name="registrationNo"
              value={patient.registrationNo}
              onChange={handlePatientChange}
              onFocus={() => setActiveField('registrationNo')}
              onBlur={() => setTimeout(() => setActiveField(null), 200)}
              placeholder="Reg No"
            />
            {activeField === 'registrationNo' && searchResults.length > 0 && (
              <ul className="autofill-dropdown">
                {searchResults.map((user) => (
                  <li key={user.id} className="autofill-item" onClick={() => selectUser(user)}>
                    <span className="name">{user.name}</span>
                    <span className="info">{user.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={patient.gender} onChange={handlePatientChange}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: '1 1 100%' }}>
            <label>Address</label>
            <input
              name="address"
              value={patient.address}
              onChange={handlePatientChange}
              placeholder="Address"
            />
          </div>
        </div>
        <div className="col-1-4">
          <h3>Patient History</h3>
          {isLoadingHistory ? (
            <p>Loading history...</p>
          ) : history.length > 0 ? (
            <ul>
              {history.map((item, idx) => (
                <li key={idx} style={{ fontSize: '12px', marginBottom: '5px' }}>
                  • {item}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '12px', color: '#888' }}>
              Enter name and telephone to load history
            </p>
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div className="row">
        <div className="full-width">
          <h3>Popular Services</h3>
          <div className="services-grid">
            {services.map((service) => (
              <div key={service.id} className="service-item">
                <input
                  type="checkbox"
                  checked={service.selected}
                  onChange={() => toggleService(service.id)}
                />
                <span style={{ flex: 1 }}>{service.name}</span>
                <span>{service.price}</span>
              </div>
            ))}
            <div className="service-item" style={{ gridColumn: 'span 3', marginTop: '10px' }}>
              <span style={{ marginRight: '10px' }}>Doctor Channel:</span>
              <input
                type="text"
                placeholder="Doctor Name"
                value={doctorChannel.name}
                onChange={(e) => setDoctorChannel({ ...doctorChannel, name: e.target.value })}
                style={{ flex: 1, padding: '5px' }}
              />
              <input
                type="number"
                value={doctorChannel.price}
                onChange={(e) =>
                  setDoctorChannel({ ...doctorChannel, price: parseInt(e.target.value) || 0 })
                }
                style={{ width: '80px', padding: '5px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="billing-footer">
        <div className="total-amount">Total: {total.toLocaleString()}</div>
        <button className="print-btn" onClick={() => window.print()}>
          Print Bill
        </button>
      </div>
    </div>
  )
}

export default App
