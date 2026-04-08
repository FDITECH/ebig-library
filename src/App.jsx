import { useRef, useState } from 'react'
import './App.css'

/* ── Components ────────────────────────────────────────────── */
import {
  AudioPlayer,
  Button,
  Calendar,
  Carousel,
  Checkbox,
  ColorPicker,
  ComponentStatus,
  CustomCkEditor5,
  DateTimePicker,
  Ebigicon,
  EbigEditor,
  EmptyPage,
  IconPicker,
  IframePlayer,
  ImportFile,
  InfiniteScroll,
  InputOtp,
  NumberPicker,
  Pagination,
  Popup,
  ProgressBar,
  ProgressCircle,
  RadioButton,
  Rating,
  SelectDropdown,
  showDialog,
  showPopup,
  SimpleButton,
  Slider,
  Switch,
  Tag,
  Text,
  TextArea,
  TextField,
  ToastMessage,
  UploadFiles,
  VideoPlayer,
} from './index'

/* ── Styles ────────────────────────────────────────────────── */
const sectionStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: '0.8rem',
  padding: '2rem',
  marginBottom: '2rem',
}
const headingStyle = {
  marginBottom: '1.2rem',
  fontWeight: 700,
  fontSize: '1.8rem',
}
const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.6rem',
  alignItems: 'center',
}

/* ────────────────────────────────────────────────────────────
   App — render every component for visual testing
   ──────────────────────────────────────────────────────────── */
export default function App() {
  /* shared state */
  const [checkboxVal, setCheckboxVal] = useState(false)
  const [switchVal, setSwitchVal] = useState(false)
  const [radioVal, setRadioVal] = useState('a')
  const [ratingVal, setRatingVal] = useState(3)
  const [sliderVal, setSliderVal] = useState(40)
  const [numberVal, setNumberVal] = useState(5)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dateVal, setDateVal] = useState(new Date())
  const [colorVal, setColorVal] = useState('#287CF0')
  const [otpVal, setOtpVal] = useState('')
  const [dropdownVal, setDropdownVal] = useState(undefined)
  const popupRef = useRef(undefined)

  return (
    <div className='col' style={{ width: '100dvw', height: '100dvh', maxWidth: '120rem', margin: '0 auto', padding: '3.2rem 2.4rem', overflow: "auto", scrollbarWidth: "thin" }}>
      <h1 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '3.2rem' }}>
        🧪 eBig Library — Component Playground
      </h1>

      {/* ── Text ──────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Text</div>
        <Text className="heading-5">Heading 5 text</Text>
        <Text className="body-1">Body 1 — Lorem ipsum dolor sit amet</Text>
        <Text maxLine={1} style={{ width: '20rem' }}>
          This text is truncated to a single line when it overflows its container
        </Text>
      </section>

      {/* ── Button ────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Button</div>
        <div style={rowStyle}>
          <Button label="Primary" className="button-primary" onClick={() => alert('Primary clicked')} />
          <Button label="Infor" className="button-infor" />
          <Button label="Warning" className="button-warning" />
          <Button label="Error" className="button-error" />
          <Button label="Success" className="button-success" />
          <Button label="Disabled" className="button-grey" disabled />
          <Button label="With Prefix" prefix={<Ebigicon src="fill/user interface/e-add" size={16} />} className="button-primary" />
        </div>
      </section>

      {/* ── Tag ────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Tag</div>
        <div style={rowStyle}>
          <Tag title="Default" />
          <Tag title="Primary" className="tag-primary" />
          <Tag title="Infor" className="tag-infor" />
          <Tag title="Warning" className="tag-warning" />
          <Tag title="Error" className="tag-error" />
          <Tag title="Success" className="tag-success" />
        </div>
      </section>

      {/* ── TextField ─────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>TextField</div>
        <div style={rowStyle}>
          <TextField placeholder="Default input" style={{ width: '24rem' }} />
          <TextField placeholder="With helper" helperText="This field is required" style={{ width: '24rem' }} />
          <TextField placeholder="Disabled" disabled style={{ width: '24rem' }} />
        </div>
      </section>

      {/* ── TextArea ──────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>TextArea</div>
        <TextArea placeholder="Type something…" style={{ width: '100%', minHeight: '8rem' }} />
      </section>

      {/* ── Checkbox ──────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Checkbox</div>
        <div style={rowStyle}>
          <Checkbox value={checkboxVal} onChange={(v) => setCheckboxVal(v)} />
          <span>checked: {String(checkboxVal)}</span>
          <Checkbox value={true} disabled />
        </div>
      </section>

      {/* ── Switch ────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Switch</div>
        <div style={rowStyle}>
          <Switch value={switchVal} onChange={(v) => setSwitchVal(v)} />
          <span>on: {String(switchVal)}</span>
          <Switch value={true} disabled />
        </div>
      </section>

      {/* ── RadioButton ───────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>RadioButton</div>
        <div style={rowStyle}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RadioButton name="demo-radio" value="a" checked={radioVal === 'a'} onChange={() => setRadioVal('a')} />
            Option A
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RadioButton name="demo-radio" value="b" checked={radioVal === 'b'} onChange={() => setRadioVal('b')} />
            Option B
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RadioButton name="demo-radio" value="c" checked={radioVal === 'c'} onChange={() => setRadioVal('c')} />
            Option C
          </label>
        </div>
      </section>

      {/* ── SelectDropdown ────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>SelectDropdown</div>
        <div style={rowStyle}>
          <SelectDropdown
            placeholder="Choose an option"
            options={[
              { id: 1, name: 'Option 1' },
              { id: 2, name: 'Option 2' },
              { id: 3, name: 'Option 3' },
            ]}
            value={dropdownVal}
            onChange={(v) => setDropdownVal(v?.id)}
            style={{ width: '24rem' }}
          />
          <SelectDropdown
            placeholder="Multi select"
            multiple
            options={[
              { id: 'a', name: 'Alpha' },
              { id: 'b', name: 'Beta' },
              { id: 'c', name: 'Gamma' },
            ]}
            style={{ width: '30rem' }}
          />
        </div>
      </section>

      {/* ── NumberPicker ──────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>NumberPicker</div>
        <div style={rowStyle}>
          <NumberPicker value={numberVal} onChange={(v) => setNumberVal(v)} min={0} max={100} />
        </div>
      </section>

      {/* ── Rating ────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Rating</div>
        <div style={rowStyle}>
          <Rating value={ratingVal} onChange={(v) => setRatingVal(v)} />
          <span>value: {ratingVal}</span>
        </div>
      </section>

      {/* ── Slider ────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Slider</div>
        <Slider
          defaultValue={sliderVal}
          min={0}
          max={100}
          tooltip
          onChange={(v) => setSliderVal(v)}
          style={{ width: '100%' }}
        />
      </section>

      {/* ── ProgressBar ───────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>ProgressBar</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
          <ProgressBar percent={65} titleText="Upload progress" />
          <ProgressBar percent={100} titleText="Complete" status={ComponentStatus.SUCCSESS} />
          <ProgressBar percent={30} progressBarOnly />
        </div>
      </section>

      {/* ── ProgressCircle ────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>ProgressCircle</div>
        <div style={rowStyle}>
          <ProgressCircle percent={25} />
          <ProgressCircle percent={50} size="6rem" />
          <ProgressCircle percent={75} size="8rem" percentColor="#16a34a" />
          <ProgressCircle percent={100} size="6rem" title="Done" />
        </div>
      </section>

      {/* ── ColorPicker ───────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>ColorPicker</div>
        <div style={rowStyle}>
          <ColorPicker value={colorVal} onChange={(v) => setColorVal(v)} style={{ width: '24rem' }} />
          <ColorPicker value="#FF5733" type="select" />
        </div>
      </section>

      {/* ── InputOtp ──────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>InputOtp</div>
        <InputOtp length={6} value={otpVal} onChange={(v) => setOtpVal(v)} />
      </section>

      {/* ── DateTimePicker ────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>DateTimePicker</div>
        <div style={rowStyle}>
          <DateTimePicker
            value={dateVal}
            onChange={(v) => setDateVal(v?.start ?? new Date())}
            style={{ width: '28rem' }}
          />
          <DateTimePicker
            pickerType="datetime"
            value={dateVal}
            style={{ width: '28rem' }}
          />
        </div>
      </section>

      {/* ── Calendar ──────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Calendar</div>
        <Calendar value={new Date()} style={{ width: '32rem' }} />
      </section>

      {/* ── Pagination ────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Pagination</div>
        <Pagination
          currentPage={page}
          itemPerPage={pageSize}
          totalItem={200}
          onChange={(ev) => { setPage(ev.page); setPageSize(ev.size) }}
        />
      </section>

      {/* ── Ebigicon ──────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Ebigicon</div>
        <div style={rowStyle}>
          <Ebigicon src="fill/user interface/e-add" size={24} />
          <Ebigicon src="fill/user interface/settings" size={24} />
          <Ebigicon src="fill/arrows/down-arrow" size={24} />
          <Ebigicon src="fill/user interface/e-delete" size={24} />
        </div>
      </section>

      {/* ── Popup ─────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Popup</div>
        <Button
          label="Open Popup"
          className="button-primary"
          onClick={() =>
            showPopup({
              ref: popupRef,
              heading: <Text className="heading-7">Popup heading</Text>,
              body: <Text className="body-2" style={{ padding: '1.6rem' }}>This is the popup body content.</Text>,
            })
          }
        />
        <Popup ref={popupRef} />
      </section>

      {/* ── Dialog ────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Dialog</div>
        <div style={rowStyle}>
          <Button
            label="Info Dialog"
            className="button-infor"
            onClick={() =>
              showDialog({
                status: ComponentStatus.INFOR,
                title: 'Information',
                content: 'This is an informational dialog.',
                onSubmit: () => { },
              })
            }
          />
          <Button
            label="Error Dialog"
            className="button-error"
            onClick={() =>
              showDialog({
                status: ComponentStatus.ERROR,
                title: 'Error',
                content: 'Something went wrong!',
                onSubmit: () => { },
              })
            }
          />
        </div>
      </section>

      {/* ── Toast ─────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Toast Notifications</div>
        <div style={rowStyle}>
          <Button label="Info Toast" className="button-infor" onClick={() => ToastMessage.infor('Info notification')} />
          <Button label="Success Toast" className="button-success" onClick={() => ToastMessage.success('Success!')} />
          <Button label="Warning Toast" className="button-warning" onClick={() => ToastMessage.warn('Warning!')} />
          <Button label="Error Toast" className="button-error" onClick={() => ToastMessage.errors('Error occurred')} />
        </div>
      </section>

      {/* ── ImportFile ────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>ImportFile</div>
        <ImportFile onChange={(files) => console.log('Files:', files)} />
      </section>

      {/* ── EmptyPage ─────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>EmptyPage</div>
        <EmptyPage
          title="No data available"
          subtitle="Try adjusting your search or filters"
          button={<Button label="Refresh" className="button-primary" />}
          imgStyle={{ maxWidth: '16rem' }}
        />
      </section>

      {/* ── InfiniteScroll ────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>InfiniteScroll</div>
        <div style={{ height: '16rem', overflow: 'auto', border: '1px solid #ddd', borderRadius: '0.4rem' }}>
          <InfiniteScroll handleScroll={async () => { }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{ padding: '0.8rem 1.2rem', borderBottom: '1px solid #f0f0f0' }}>
                Item {i + 1}
              </div>
            ))}
          </InfiniteScroll>
        </div>
      </section>

      {/* ── Carousel ──────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>Carousel</div>
        <Carousel
          autoPlay
          duration={3000}
          buttons
          style={{ height: '24rem', width: '100%' }}
        >
          <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', fontSize: '2.4rem', fontWeight: 700 }}>
            Slide 1
          </div>
          <div style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', fontSize: '2.4rem', fontWeight: 700 }}>
            Slide 2
          </div>
          <div style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', fontSize: '2.4rem', fontWeight: 700 }}>
            Slide 3
          </div>
        </Carousel>
      </section>

      {/* ── SimpleButton ──────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>SimpleButton</div>
        <div style={rowStyle}>
          <SimpleButton label="Simple Primary" className="button-primary" onClick={() => alert('SimpleButton clicked')} />
          <SimpleButton label="Simple Infor" className="button-infor" />
          <SimpleButton label="Simple Disabled" className="button-grey" disabled />
        </div>
      </section>

      {/* ── VideoPlayer ───────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>VideoPlayer</div>
        <VideoPlayer
          src="https://www.w3schools.com/html/mov_bbb.mp4"
          style={{ width: '100%', maxWidth: '48rem', borderRadius: '0.8rem' }}
        />
      </section>

      {/* ── AudioPlayer ───────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>AudioPlayer</div>
        <AudioPlayer
          src="https://www.w3schools.com/html/horse.ogg"
          style={{ width: '100%', maxWidth: '48rem' }}
        />
      </section>

      {/* ── IframePlayer ──────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>IframePlayer</div>
        <IframePlayer
          src="https://www.wikipedia.org"
          style={{ width: '100%', height: '24rem', border: '1px solid #ddd', borderRadius: '0.8rem' }}
        />
      </section>

      {/* ── IconPicker ────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>IconPicker</div>
        <div style={rowStyle}>
          <IconPicker
            src="fill/user interface/settings"
            size={32}
            onChange={(src) => console.log('Icon selected:', src)}
          />
          <Text className="body-3">← Click the icon to open the picker</Text>
        </div>
      </section>

      {/* ── EbigEditor ────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>EbigEditor</div>
        <EbigEditor
          placeholder="Type something with rich-text support…"
          style={{ width: '100%', minHeight: '12rem' }}
          onChange={(value) => console.log('Editor value:', value)}
        />
      </section>

      {/* ── UploadFiles ───────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>UploadFiles</div>
        <UploadFiles
          multiple
          placeholder="Click to upload files"
          onChange={(files) => console.log('Uploaded files:', files)}
          style={{ width: '100%' }}
        />
      </section>

      {/* ── CustomCkEditor5 ───────────────────────────── */}
      <section style={sectionStyle}>
        <div style={headingStyle}>CustomCkEditor5</div>
        <Text className="body-3" style={{ color: '#888' }}>
          CKEditor 5 requires a license key and upload adapter configuration.
          Below is a placeholder instance:
        </Text>
        <div style={{ marginTop: '1.2rem' }}>
          <CustomCkEditor5
            style={{ width: '100%', height: 300, borderRadius: 8 }}
            onChange={(data) => console.log('CKEditor data:', data)}
          />
        </div>
      </section>
    </div>
  )
}
