import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-primary text-white relative overflow-hidden" style={{ padding: '60px 30px' }}>
      <div 
        className="mx-auto relative z-10"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '60px'
        }}
      >
        {/* Get in touch */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'flex-start',
            fontSize: '15px',
            borderBottom: '1px solid #222',
            paddingBottom: '40px'
          }}
        >
          <div>
            <p style={{ 
              margin: 0, 
              color: '#b0b0b0', 
              fontWeight: 600, 
              fontSize: '16px' 
            }}>
              Get in touch
            </p>
          </div>
          <div style={{ display: 'flex', gap: '60px' }}>
            <a 
              href="mailto:hello@mentorak.com"
              style={{
                color: '#ffffff',
                fontSize: '30px',
                fontWeight: 'bold',
                textDecoration: 'none',
                borderBottom: '2px solid #ffffff'
              }}
              className="hover:text-accent transition-colors"
            >
              E-Mail
            </a>
            <a 
              href="tel:+1234567890"
              style={{
                color: '#ffffff',
                fontSize: '30px',
                fontWeight: 'bold',
                textDecoration: 'none',
                borderBottom: '2px solid #ffffff'
              }}
              className="hover:text-accent transition-colors"
            >
              Call us
            </a>
          </div>
        </div>

        {/* Locations */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'flex-start',
            fontSize: '15px',
            borderBottom: '1px solid #222',
            paddingBottom: '40px'
          }}
        >
          <div>
            <p style={{ 
              margin: 0, 
              color: '#b0b0b0', 
              fontWeight: 600, 
              fontSize: '16px' 
            }}>
              Locations
            </p>
          </div>
          <div style={{ display: 'flex', gap: '80px' }}>
            <div style={{ color: '#aaa', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>
                Head Office
              </strong>
              Chattogram, Bangladesh
            </div>
            <div style={{ color: '#aaa', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>
                Offshoot
              </strong>
              Hillview, 2no road
            </div>
          </div>
        </div>

        {/* Connect */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'flex-start',
            fontSize: '15px',
            borderBottom: '1px solid #222',
            paddingBottom: '40px'
          }}
        >
          <div>
            <p style={{ 
              margin: 0, 
              color: '#b0b0b0', 
              fontWeight: 600, 
              fontSize: '16px' 
            }}>
              Connect
            </p>
          </div>
          <div>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0, 
              color: '#aaa', 
              lineHeight: 2 
            }}>
              <li>
                <a 
                  href="#" 
                  style={{ color: '#aaa', textDecoration: 'none' }}
                  className="hover:underline"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  style={{ color: '#aaa', textDecoration: 'none' }}
                  className="hover:underline"
                >
                  X/Twitter
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  style={{ color: '#aaa', textDecoration: 'none' }}
                  className="hover:underline"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  style={{ color: '#aaa', textDecoration: 'none' }}
                  className="hover:underline"
                >
                  Newsletter
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  style={{ color: '#aaa', textDecoration: 'none' }}
                  className="hover:underline"
                >
                  Referral Program
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Language */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'flex-start',
            fontSize: '15px',
            borderBottom: '1px solid #222',
            paddingBottom: '40px'
          }}
        >
          <div>
            <p style={{ 
              margin: 0, 
              color: '#b0b0b0', 
              fontWeight: 600, 
              fontSize: '16px' 
            }}>
              Language
            </p>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '15px' }}>
            <a 
              href="#"
              style={{
                color: '#fff',
                textDecoration: 'none',
                borderBottom: '2px solid #fff',
                paddingBottom: '2px'
              }}
            >
              English
            </a>
            <a 
              href="#"
              style={{
                color: '#aaa',
                textDecoration: 'none',
                borderBottom: '2px solid transparent',
                paddingBottom: '2px'
              }}
              className="hover:text-white transition-colors"
            >
              Deutsch
            </a>
          </div>
        </div>

        {/* Legals */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'flex-start',
            fontSize: '15px'
          }}
        >
          <div>
            <p style={{ 
              margin: 0, 
              color: '#b0b0b0', 
              fontWeight: 600, 
              fontSize: '16px' 
            }}>
              Legals
            </p>
          </div>
          <div>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0, 
              color: '#aaa', 
              lineHeight: 2 
            }}>
              <li>
                <a 
                  href="#" 
                  style={{ color: '#aaa', textDecoration: 'none' }}
                  className="hover:underline"
                >
                  Terms of Use
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  style={{ color: '#aaa', textDecoration: 'none' }}
                  className="hover:underline"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  style={{ color: '#aaa', textDecoration: 'none' }}
                  className="hover:underline"
                >
                  Imprint
                </a>
              </li>
            </ul>
            
            {/* Copyright */}
            <div style={{ marginTop: '20px' }}>
              <p style={{ 
                margin: 0, 
                color: '#666', 
                fontSize: '12px' 
              }}>
                ©2025 Mentorak built with Kiro
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Large Mentorak Text Background */}
      <div className="absolute bottom-0 right-0 pointer-events-none">
        <div 
          className="text-white/5 font-bold select-none"
          style={{
            fontSize: 'clamp(8rem, 20vw, 24rem)',
            lineHeight: '0.8',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.02em',
            transform: 'translateY(20%)',
            maskImage: 'linear-gradient(194deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.157) 5%, rgb(0, 0, 0) 66%)',
            WebkitMaskImage: 'linear-gradient(194deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.157) 5%, rgb(0, 0, 0) 66%)'
          }}
        >
          Mentorak
        </div>
      </div>
    </footer>
  )
}