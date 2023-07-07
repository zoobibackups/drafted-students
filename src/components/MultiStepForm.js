import React, { useCallback, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import axios from 'axios';

// import resumeAttachImage from './logo.svg';
import VideoRecorder from 'react-video-recorder/lib/video-recorder';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import * as Yup from 'yup';
import AWS from 'aws-sdk';
import Levenshtein from 'fast-levenshtein';

const S3_BUCKET_NAME = 'uploads-video-resumes';
const COLLEGE_API_KEY = 'EgIiqDEdQRrdJtuN6oXP5Zd7t18Dvs30VuLhIEX9';

const findUniversities = (inputValue) => {
  if (!inputValue || inputValue.length < 2) {
    return Promise.resolve([]);
  }

  return axios
    .get(`https://api.data.gov/ed/collegescorecard/v1/schools.json?school.name=${inputValue}&api_key=${COLLEGE_API_KEY}`)
    .then((response) => {
      const universities = response.data.results.map((university) => ({
        value: university.id,
        label: university.school.name
      }));

      // Sort the universities by the closeness of the match.
      universities.sort((a, b) => {
        // Calculate the distance of each school name from the input value.
        const distanceA = Levenshtein.get(a.label.toLowerCase(), inputValue.toLowerCase());
        const distanceB = Levenshtein.get(b.label.toLowerCase(), inputValue.toLowerCase());

        // Sort by ascending distance (closer matches come first).
        return distanceA - distanceB;
      });

      return universities;
    })
    .catch((error) => {
      console.error("Error during fetching universities", error);
      return [];
    });
};



const MySelect = ({ field, form }) => {
  return (
    <AsyncSelect
      name={field.name}
      value={field.value}
      onChange={(option) => form.setFieldValue(field.name, option)}
      loadOptions={findUniversities}
    />
  );
};



AWS
    .config
    .update({
        credentials: new AWS.CognitoIdentityCredentials({IdentityPoolId: 'us-east-1:94a5ad1e-59ad-4c5c-9cb0-2cafb2b96a47'}),
        maxRetries: 3,
        httpOptions: {
            timeout: 30000,
            connectTimeout: 5000
        },
        region: 'us-east-1'
    })

// us-east-1:d7a7df87-bbac-4b59-b1b3-6e48f40a0f48 locks S3 API version
AWS.config.apiVersions = {
    s3: '2006-03-01'
};

// S3 bucket holding video resumes to upload to S3
var s3 = new AWS.S3({
    params: {
        Bucket: 'uploads-video-resumes'
    },
    region: 'us-east-1'
});


const MultiStepForm = ({submitHandler}) => {
  const [/*step*/, setStep] = useState(1);
  const [/*formSubmitted*/, setFormSubmitted] = useState(false);
  const [/*isVideoRecorded*/, setIsVideoRecorded] = useState(false);
  const [values, /*setValues*/] = useState({});
  const [/*errorMessage*/, /*setErrorMessage*/] = useState('');

   // state variables to check video record
   const [isVideo1Recorded, setVideo1Recorded] = useState(false);
   const [isVideo2Recorded, setVideo2Recorded] = useState(false);
   const [isVideo3Recorded, setVideo3Recorded] = useState(false);
    

  const initialValues = {
    step: 1,
    email: '',
    university: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    major: '',
    graduationMonth: '',
    graduationYear: '',
    linkedInProfileURL: '',
    resume: '',
  };
//   const formik = useFormik({
//     initialValues,
//     onSubmit: submitHandler,
//     enableReinitialize: true,
//   })

//   const validationSchema = Yup.object().shape({
//     email: Yup.string().email('Invalid email address').required('Email is required'),
//     university: Yup.string().required('University is required'),
//     password: Yup.string().required('Password is required'),
//     confirmPassword: Yup.string()
//       .oneOf([Yup.ref('password'), null], 'Passwords must match')
//       .required('Confirm Password is required'),
//     firstName: Yup.string().required('First Name is required'),
//     lastName: Yup.string().required('Last Name is required'),
//     major: Yup.string().required('Major is required'),
//     graduationMonth: Yup.string().required('Graduation Month is required'),
//     graduationYear: Yup.number().required('Graduation Year is required'),
//   });
  


//   const step1ValidationSchema = Yup.object().shape({
//     email: Yup.string().email('Invalid email').required('Email is required'),
//   });

//   const step2ValidationSchema = Yup.object().shape({
//     university: Yup.string().required('University is required'),
//   });

//   const step3ValidationSchema = Yup.object().shape({
//     password: Yup.string().required('Password is required'),
//     confirmPassword: Yup.string()
//       .oneOf([Yup.ref('password'), null], 'Passwords must match')
//       .required('Confirm Password is required'),
//   });

//   const step4ValidationSchema = Yup.object().shape({
//     firstName: Yup.string().required('First Name is required'),
//     lastName: Yup.string().required('Last Name is required'),
//     major: Yup.string().required('Major is required'),
//     graduationMonth: Yup.string().required('Graduation Month is required'),
//     graduationYear: Yup.number()
//       .required('Graduation Year is required')
//       .min(2022, 'Graduation Year must be at least 2022')
//       .max(2040, 'Graduation Year cannot exceed 2040'),
//   });

//   const step5ValidationSchema = Yup.object().shape({
//   });


const handleUpload = useCallback((videoBlob, questionNumber) => {
  // video upload
  console.log("Handle upload is called");

  const videoParams = {
    Bucket: S3_BUCKET_NAME,
    Key: `${globalUniversity}/${globalFirstName} ${globalLastName}/question-${questionNumber}-video-resume.mp4`,
    Body: videoBlob,
    ContentType: 'video/mp4',
    ACL: 'public-read'
  };

  return new Promise((resolve, reject) => {
    s3.putObject(videoParams, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        reject(err);
      } else {
        console.log(data);           // successful response
        console.log("Video " + questionNumber + " was uploaded successfully at " + data.Location);
        if (questionNumber === 1) {
            setVideo1Recorded(true);
            globalVideo1 = videoBlob;
            globalVideo1Link = "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key;
        } else if (questionNumber === 2) {
            setVideo2Recorded(true);
            globalVideo2 = videoBlob;
            globalVideo2Link = "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key;
        } else if (questionNumber === 3) { // last step
            setVideo3Recorded(true);
            globalVideo3 = videoBlob;
            globalVideo3Link = "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key;
        }
        resolve(data);
      }
    });
  });
}, [setVideo1Recorded, setVideo2Recorded, setVideo3Recorded]);


  const handleNextVideoStep = async (step, videoBlob) => {
    if (step === 6 && !isVideo1Recorded) {
      alert('Please finish video recording to proceed and get Drafted!');
      return;
    }
    else if (step === 7 && !isVideo2Recorded) {
      alert('Please finish video recording to proceed and get Drafted!');
      return;
    }
   else if (step === 8 && !isVideo3Recorded) {
      alert('Please finish video recording to proceed and get Drafted!');
      return;
    }
    // success cases

    // question 1
    if (step === 6 && isVideo1Recorded && globalVideo1Link !== "") {
      console.log("Video 1 was recorded");
      setStep(7);
    } else if (step === 6 && isVideo1Recorded && globalVideo1Link === "") {
      alert("Uploading video resume! Give us a sec...");
      await handleUpload(videoBlob, 1);
      setStep(7);
    } else {
      alert("Please finish video recording to proceed and get Drafted!");
    }

    // question 2
    if (step === 7 && isVideo2Recorded && globalVideo2Link !== "") {
      console.log("Video 2 was recorded");
      setStep(8);
    } else if (step === 7 && isVideo2Recorded && globalVideo2Link === "") {
      alert("Uploading video resume! Give us a sec...");
      await handleUpload(videoBlob, 2);
      setStep(8);
    } else {
      alert("Please finish video recording to proceed and get Drafted!");
    }

    // question 3
    if (step === 8 && isVideo3Recorded && globalVideo3Link !== "") {
      console.log("Video 3 was recorded");
      setStep(9);
    } else if (step === 8 && isVideo3Recorded && globalVideo3Link === "") {
      alert("Uploading video resume! Give us a sec...");
      await handleUpload(videoBlob, 3);
      setStep(9);
    } else {
      alert("Please finish video recording to proceed and get Drafted!");
    }
  };

  const handleTextUpload = () => {
        const formData = {
            firstName: globalFirstName,
            lastName: globalLastName,
            university: globalUniversity,
            major: globalMajor,
            graduationMonth: globalGraduationMonth,
            graduationYear: globalGraduationYear,
            linkedInURL: globalLinkedInProfileURL,
            video1: globalVideo1Link,
            video2: globalVideo2Link,
            video3: globalVideo3Link
        }
        const formDataJsonString = JSON.stringify(formData);

        // Handle submission of form data
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: `${globalUniversity}/${globalFirstName} ${globalLastName}/${globalFirstName}-${globalLastName}/information.json`,
            Body: formDataJsonString,
            ContentType: 'application/json',
            ACL: 'public-read'
        }

        s3.putObject(params, function(err, data) {
            if (err) {
              console.log(err, err.stack); // an error occurred
            } else {
              console.log(data);           // successful response
              console.log("JSON was uploaded successfully at " + data.Location);
            }
        });
  }

  const buttonStyles = {
    borderRadius: '8px',
    backgroundColor: '#207a56',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    cursor: 'pointer',
  };

  const letsGoProButtonStyle = {
    borderRadius: '8px',
    backgroundColor: '#207a56',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    cursor: 'pointer'
  };

  /* Not needed as of now, using setStep directly
    const handleNextStep = (values) => {
        const isValid = isFormComplete(values, step);
        let isValid = false;

        switch (step) {
            case 1:
              console.log("Case 1")
              console.log(values)
              isValid = step1ValidationSchema.isValidSync(values);
              break;
            case 2:
              console.log("Case 2")
              isValid = step2ValidationSchema.isValidSync(values);
              break;
            case 3:
              console.log("Case 3")
              isValid = step3ValidationSchema.isValidSync(values);
              break;
            case 4:
              console.log("Case 4")
              isValid = step4ValidationSchema.isValidSync(values);
              break;
            case 5:
              console.log("Case 5")
              isValid = step5ValidationSchema.isValidSync(values);
              break;
            gl
                console.log("Case 6")
            case 7:
                console.log("Case 7")
            case 8:
                console.log("Case 8")
              isValid = isVideoRecorded;
              break;
            default:
              return true;
          }

        if (!isValid) {
            console.log("Doesn't detect input")
            setErrorMessage('Please enter required forms to continue');
            return;
        }
        
        setErrorMessage('');
        setStep((prevStep) => prevStep + 1);
    };
  
    const handlePreviousStep = () => {
        setStep((prevStep) => prevStep - 1);
    };
*/

  const handleKeyPress = (event, nextStep) => {
        if (event.key === 'Enter') {
            setStep(nextStep);
    }
  };

  const months = {
    1 : "January",
    2: "February",
    3: "March",
    4: "April",
    5: "Mayo",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December"
  }

  const onSubmit = (values) => {
        console.log(values);
   };

   let draftedUniversity = "";
   let globalEmail = "";
   let globalPassword = ""; // @TODO: Encrypt, attention to Drafted engineers: never, never, EVER log any password or critical customer information!
   let globalFirstName = "";
   let globalLastName = "";
   let globalUniversity = "";
   let globalMajor = "";
   let globalGraduationMonth = "";
   let globalGraduationYear = "";
   let globalLinkedInProfileURL = "";
   let globalResume = null; // @TODO: Have to figure this out
   let globalVideo1 = null; // What file type is this?
   let globalVideo2 = null;
   let globalVideo3 = null;
   let globalVideo1Link = "";
   let globalVideo2Link = "";
   let globalVideo3Link = "";
  


const RenderStepContent = () => {
    // const { step } = formik.values;
    const [step, setStep] = React.useState(1);
  
    switch (step) {
        case 1:
            return (
              <>
                <Formik
                  initialValues={{
                    email: ""
                  }}
                  validationSchema={Yup.object({
                    email: Yup
                      .string()
                      .email("Invalid email address")
                      .required("Email is required")
                  })}
                  onSubmit={(values) => {
                        if (values.email.endsWith("fiu.edu")) {
                            // FIU
                            draftedUniversity = "Florida International University";
                            globalEmail = values.email;
                            console.log("Saved university: ", draftedUniversity);
                            setStep(3); // skips step
                        } else if (values.email.endsWith("miami.edu")) {
                            // UMiami
                            draftedUniversity = "University of Miami";
                            globalEmail = values.email;
                            console.log("Saved university: ", draftedUniversity);
                            setStep(3); // skips step
                        } else if (values.email.endsWith("usf.edu")) {
                            // UMiami
                            draftedUniversity = "University of South Florida";
                            globalEmail = values.email;
                            console.log("Saved university: ", draftedUniversity);
                            setStep(3); // skips step
                        } else {
                            // Not a drafted uni, go to next
                            globalEmail = values.email;
                            setStep(2);
                        }
                  }}
                >
                  {formik => (
                    <Form>
                      <h2>Let's find your next job</h2>
                      <h3>Join Drafted's community of job seekers</h3>
                      <p>The best place for college students, recent graduates, and early career professionals to find jobs and internships.</p>
                      <div>
                        <label htmlFor="email">Email Address</label>
                        <Field type="email" id="email" name="email" style={{ width: '95%' }} />
                        <ErrorMessage name="email" component="div" className="error" />
                      </div>
                      {formik.values.email.endsWith("fiu.edu") && (
                        <>
                          <p style = {{fontWeight: 'bold'}}>Florida International University</p>
                          <p>Welcome, Panther!</p>
                        </>
                      )}
                      {formik.values.email.endsWith("miami.edu") && (
                        <>
                          <p style = {{fontWeight: 'bold'}}>University of Miami</p>
                          <p>Welcome, Cane!</p>
                        </>
                      )}
                      {formik.values.email.endsWith("usf.edu") && (
                        <>
                          <p style = {{fontWeight: 'bold'}}>University of South Florida</p>
                          <p>Welcome, Bull!</p>
                        </>
                      )}
                      <br />
                      <br></br>
                      {/* <div style={{ display: 'flex', justifyContent: 'center' }}> */}
                        <button type="submit" style={letsGoProButtonStyle}>
                            Let's go pro
                        </button>
                      {/* </div> */}
                      {/* Uncomment to go directly to video step */}
                      <button type="button" onClick={setStep(6)}>Debug Video</button>
                    </Form>
                  )}
                </Formik>
              </>
            );                  
          case 2:
            return (
              <>
                <Formik
                  initialValues={{ university: null }}
                  validationSchema={Yup.object({
                    university: Yup.object().shape({
                      label: Yup.string().required('Please select your school'),
                      value: Yup.string().required('Please select your school'),
                    }),
                  })}                  
                  onSubmit={(values) => {
                    if (values.university !== "") {
                        globalUniversity = values.university.label;
                        console.log("Saved university: ", globalUniversity);
                        setStep(3);
                    }
                  }}
                >
                  {({ setFieldValue, values, errors, touched }) => (
                  <Form>
                  <h2>Find your school</h2>
                  <p>Select your university below. This will help more employers targeting your school find you.</p>
                  <div>
                    <label htmlFor="university">University</label>
                    <Field
                      name="university"
                      component={MySelect}
                      onChange={setFieldValue}
                      value={values.university}
                    />
                    {touched.university && errors.university ? (
                      <div className="error">{errors.university}</div>
                    ) : null}
                  </div>
                  <br></br>
                  <button type="button" onClick={() => setStep(1)}>Previous</button>
                  <button type="submit" style={buttonStyles} disabled={!values.university}>
                    Continue to the next step
                  </button>
                </Form>
                  )}
                  {/* {formik => (
                    <Form>
                      <h2>Find your school</h2>
                      <p>Select your university below. This will help more employers targeting your school find you.</p>
                      <div>
                        <label htmlFor="university">University</label>
                        <Field as="select" id="university" name="university" style={{ width: '95%' }}>
                          <option value="">Select an option</option>
                          <option value="Florida International University">Florida International University</option>
                          <option value="University of Miami">University of Miami</option>
                          <option value="Miami-Dade College">Miami-Dade College</option>
                          <option value="Lynn University">Lynn University</option>
                        </Field>
                        {formik.touched.university && formik.errors.university ? (
                          <div className="error">Please select your school</div>
                        ) : null}
                      </div>
                      <br></br>
                      <button type="button" onClick={() => setStep(1)}>Previous</button>
                      <button type="submit" style={buttonStyles}>
                        Continue to the next step
                      </button>
                    </Form>
                  )} */}
                </Formik>
              </>
            );          
        case 3:
            return (
                <Formik
                initialValues={{
                    password: "",
                    confirmPassword: ""
                }}
                validationSchema={Yup.object().shape({ 
                    password: Yup.string().required('Password is required'),
                    confirmPassword: Yup.string()
                        .oneOf([Yup.ref('password'), null], 'Passwords must match')
                        .required('Confirm Password is required'),
                })}
                onSubmit={(values) => {
                    if (values.password !== "" && (values.password === values.confirmPassword)) {
                        globalPassword = values.password;
                        console.log("Saved password...");
                        setStep(4);
                    }
                }}
                >
                <Form>
                <h2>Create your password</h2>
                <div>
                <label htmlFor="password">Password</label>
                <Field type="password" id="password" name="password" style={{ width: '95%' }} />
                <ErrorMessage name="password" component="div" className="error" />
                </div>
                <div>
                    <br></br>
                <label htmlFor="confirmPassword">Re-enter Password</label>
                <Field type="password" id="confirmPassword" name="confirmPassword" style={{ width: '95%' }} />
                <ErrorMessage name="confirmPassword" component="div" className="error" />
            </div>
                <p>
                Once you create an account, you'll start to receive Drafted emails. You can unsubscribe at any time.
                </p>
                <button type="button" onClick={() => {
                    if (draftedUniversity !== "") {
                        setStep(1);
                    } else {
                        setStep(2);
                    }
                }}
                >Previous</button>
                <button type="submit" style={buttonStyles}>Create Account</button>
                </Form>
            </Formik>
            );
      case 4:
        return (
            <Formik
            initialValues={{ 
                firstName: "",
                lastName: "",
                major: "",
                graduationMonth: "",
                graduationYear: ""
             }}
            validationSchema={Yup.object().shape({
                firstName: Yup.string().required('First Name is required'),
                lastName: Yup.string().required('Last Name is required'),
                major: Yup.string().required('Major is required'),
                graduationMonth: Yup.number().required('Graduation Month is required'),
                graduationYear: Yup.number().required('Graduation Year is required'),
              })}
            onSubmit={(values) => {
                if (values.firstName !== "" && values.lastName !== "" 
                        && values.major !== "" 
                        && values.graduationMonth !== "" 
                        && values.graduationYear !== "") {
                            globalFirstName = values.firstName;
                            globalLastName = values.lastName;
                            globalMajor = values.major;
                            globalGraduationMonth = months[values.graduationMonth];
                            globalGraduationYear = values.graduationYear;

                            // check for linkedin
                            if (values.linkedInProfileURL !== "") {
                                globalLinkedInProfileURL = values.linkedInProfileURL;
                                console.log("Saved LinkedIn URL: ", globalLinkedInProfileURL);
                            }

                            /// Saving them
                            console.log("Saved first name: ", globalFirstName);
                            console.log("Saved last name: ", globalLastName);
                            console.log("Saved major: ", globalMajor);
                            console.log("Saved graduation month: ", globalGraduationMonth);
                            console.log("Saved graduation year: ", globalGraduationYear);

                            // Who is the candidate
                            if (draftedUniversity !== "") {
                                console.log(globalFirstName + " " + globalLastName + " goes to " 
                                + draftedUniversity + ", plans to graduate " 
                                + globalGraduationMonth + " " 
                                + globalGraduationYear + " and is currently studying " + globalMajor + ". You can reach " + globalFirstName + " through " + globalEmail + "!");
                            } else {
                                console.log(globalFirstName + " " + globalLastName + " goes to " 
                                + globalUniversity + ", plans to graduate " 
                                + globalGraduationMonth + " " 
                                + globalGraduationYear + " and is currently studying " + globalMajor + ". You can reach " + globalFirstName + " through " + globalEmail + "!");
                            }
                            if (globalLinkedInProfileURL) { console.log(globalFirstName + " is also on LinkedIn: " + globalLinkedInProfileURL + ".") }

                            setStep(5);
                } else {
                    setFormSubmitted(false);
                } 
            }}
            >
            <Form>
                <div>
                <label htmlFor="firstName">* First Name</label>
                <Field type="text" id="firstName" name="firstName" style={{ width: '95%' }} />
                <ErrorMessage name="firstName" component="div" className="error" />
                </div>
                <br></br>
                <div>
                <label htmlFor="lastName">* Last Name</label>
                <Field type="text" id="lastName" name="lastName" style={{ width: '95%' }} />
                <ErrorMessage name="lastName" component="div" className="error" />
                </div>
                <br></br>
                <div>
                <label htmlFor="major">* Major</label>
                <Field type="text" id="major" name="major" style={{ width: '95%' }} />
                <ErrorMessage name="major" component="div" className="error" />
                </div>
                <br></br>
                <div>
                <label htmlFor="graduationMonth">* Graduation Month</label>
                <Field as="select" id="graduationMonth" name="graduationMonth" style={{ width: '95%' }}>
                    <option value="">What month do you expect to graduate?</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                        {new Date(0, month - 1).toLocaleString('en-US', { month: 'long' })}
                    </option>
                    ))}
                </Field>
                <ErrorMessage name="graduationMonth" component="div" className="error" />
                <br></br>
                </div>
                <div>
                <br></br>
                <label htmlFor="graduationYear">* Graduation Year</label>
                {/* <Field type="number" id="graduationYear" name="graduationYear" min="2022" max="2040" style={{ width: '95%' }} /> */}
                <Field as="select" id="graduationYear" name="graduationYear" style={{ width: '95%' }}>
                <option value="">Select a year</option>
                {[...Array(6)].map((_, i) => 
                    <option key={i} value={2022 + i}>{2022 + i}</option>
                )}
                </Field>
                <ErrorMessage name="graduationYear" component="div" className="error" />
                <br></br>
                </div>
                <div>
                <br></br>
                <label htmlFor="linkedInProfile">LinkedIn Profile</label>
                <Field type="text" id="linkedInProfileURL" name="linkedInProfileURL" style={{ width: '95%' }} />
                <ErrorMessage name="linkedInProfileURL" component="div" className="error" />
                <br></br>
                </div>
                <div>
                <br></br>
                {/* <label htmlFor="resume">Attach Resume</label>
                <Field type="file" id="resume" name="resume" accept=".pdf" />
                <ErrorMessage name="resume" component="div" className="error" /> */}
                {/* TODO: Attach resume upload image */}
                {/* <label htmlFor="resume2"><img 
                    src={resumeAttachImage} 
                    alt="Attach Resume"
                    style={{
                        maxWidth: "20%",
                        maxHeight: "100%",
                        width: "auto",
                        height: "auto"
                    }}
                /></label>
                <Field type="file" id="resume2" name="resume2" accept=".pdf" />
                <ErrorMessage name="resume2" component="div" className="error" /> */}
                </div>
                <button type="button" onClick={() => setStep(3)}>Previous</button>
                <button 
                    type="submit" 
                    style={buttonStyles}
                >
                Next
                </button>
            </Form>
      </Formik>    
        );
      case 5:
        return (
          <>
            <Formik
            onSubmit={() => setStep(6)}
            onKeyPress={() => handleKeyPress(6)}
            ></Formik>
            <Form>
            <h2>Let's record your video resume</h2>
            <h3>The video resume is how Drafted changes the way you get hired.</h3>
            <p>With just one video resume you'll gain exposure to over 1,000 companies.</p>
            <p>We'll ask just 3 questions, and you'll have up to 1 minute to answer each question.</p>
            <p>Don't worry, you can restart until you're happy with it!</p>
            <button type="button" onClick={() => setStep(4)}>Previous</button>
            <button type="button" onClick={() => setStep(6)} style={buttonStyles}>
              Continue
            </button>
            </Form>
          </>
        );
        case 6:
          return (
            <>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", marginTop: "-50px" }}>
                <div style={{ display: "flex", width: "800px" }}>
                  <div style={{ flex: 1, marginRight: "10px" }}>
                    <Formik
                      onSubmit={async (values, { setSubmitting }) => {
                        // Submit logic for the text form
                      }}
                    >
                      <Form style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px" }}>
                        <h2>Question 1 of 3</h2>
                        <h3>Tell us about yourself!</h3>
                        <p>
                          Pro tips:
                          <br />
                          <ul>
                            <li>
                              This is the typical "walk me through your resume" question. Talk about what you majored in and why. What internships or experiences you've had, and what have you learned from them? What skills will you bring to the hiring company?
                            </li>
                            <li>Show why you're the best candidate to get an opportunity, in terms of degree, internships, and experience as well as soft skills which truly set you apart. Talk about what you are passionate about, and what you hope to explore in your first role.</li>
                            <li>Demonstrate that you can communicate clearly and effectively, present yourself professionally, and most importantly have fun and show your enthusiasm to go pro and put that degree to work!</li>
                          </ul>
                        </p>
                        <div style={{ marginBottom: "20px" }}>
                        </div>
                      </Form>
                    </Formik>
                  </div>
                  <div style={{ flex: 1, marginLeft: "10px" }}>
                    <Formik
                      initialValues={{ video1: null }}
                      onSubmit={async (values, { setSubmitting }) => {
                        if (values.video1) {
                          try {
                            if (globalVideo1Link === "") {
                              // Upload the video and proceed to the next step only after the upload is successful
                              await handleUpload(values.video1, 1);
                            }
                            setStep(7);
                            setSubmitting(false);
                          } catch (error) {
                            console.error("Video upload failed:", error);
                            alert('There was an issue uploading the video, please try again.');
                            setSubmitting(false);
                          }
                        } else {
                          alert('Please finish video recording to proceed and get Drafted!');
                          setSubmitting(false);
                        }
                      }}
                    >
                      {({ setFieldValue }) => (
                        <Form style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px" }}>
                          <VideoRecorder
                            key={1}
                            isOnInitially
                            timeLimit={60000}
                            showReplayControls
                            onRecordingComplete={(videoBlob) => {
                              // Set the global video blob
                              setFieldValue("video1", videoBlob);
                              setVideo1Recorded(true);
                            }}
                          />
                          <div className="video-frame"></div>
                          <p className="video-info">Video Response: 1 min time limit</p>
                          <p className="video-info">Unlimited retries</p>
                          <button type="button" onClick={() => setStep(5)}>Previous</button>
                          <button
                            type="submit"
                            style={buttonStyles}
                            disabled={!isVideo1Recorded}
                          >
                            Next question
                          </button>
                        </Form>
                      )}
                    </Formik>
                  </div>
                </div>
              </div>
            </>
          );
          case 7:
            return (
              <>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", marginTop: "-50px" }}>
                  <div style={{ display: "flex", width: "800px" }}>
                    <div style={{ flex: 1, marginRight: "10px" }}>
                      <Formik
                        onSubmit={async (values, { setSubmitting }) => {
                          // Submit logic for the text form
                        }}
                      >
                        <Form style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px" }}>
                          <h2>Question 2 of 3</h2>
                          <h3>What makes you stand out amongst other candidates?</h3>
                          <p>
                            Pro tips:
                            <br />
                            <ul>
                                <li>
                                Don’t be modest — this is the time to be confident about your strengths and really sell yourself to employers.                </li>
                                <li>
                                Focus on your education, skills, and experiences that make you unique! Tell employers how your unique skills will help the company succeed.                  </li>
                                <li>
                                Employers ask this to identify reasons why hiring you is better than hiring a similarly qualified candidate.                   </li>
                                <li>
                                Avoid generic phrases like "I'm a hard worker".
                                </li>
                            </ul>
                            </p>
                          <div style={{ marginBottom: "20px" }}>
                          </div>
                        </Form>
                      </Formik>
                    </div>
                    <div style={{ flex: 1, marginLeft: "10px" }}>
                      <Formik
                        initialValues={{ video2: null }}
                        onSubmit={async (values, { setSubmitting }) => {
                          if (values.video2) {
                            try {
                              if (globalVideo2Link === "") {
                                // Upload the video and proceed to the next step only after the upload is successful
                                await handleUpload(values.video2, 2);
                              }
                              setStep(8);
                              setSubmitting(false);
                            } catch (error) {
                              console.error("Video upload failed:", error);
                              alert('There was an issue uploading the video, please try again.');
                              setSubmitting(false);
                            }
                          } else {
                            alert('Please finish video recording to proceed and get Drafted!');
                            setSubmitting(false);
                          }
                        }}
                      >
                        {({ setFieldValue }) => (
                          <Form style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px" }}>
                            <VideoRecorder
                              key={2}
                              isOnInitially
                              timeLimit={60000}
                              showReplayControls
                              onRecordingComplete={(videoBlob) => {
                                // Set the global video blob
                                setFieldValue("video2", videoBlob);
                                setVideo2Recorded(true);
                              }}
                            />
                            <div className="video-frame"></div>
                            <p className="video-info">Video Response: 1 min time limit</p>
                            <p className="video-info">Unlimited retries</p>
                            <button type="button" onClick={() => setStep(6)}>Previous</button>
                            <button
                              type="submit"
                              style={buttonStyles}
                              disabled={!isVideo2Recorded}
                            >
                              Next question
                            </button>
                          </Form>
                        )}
                      </Formik>
                    </div>
                  </div>
                </div>
              </>
            );        
            case 8:
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", marginTop: "-50px" }}>
                    <div style={{ display: "flex", width: "800px" }}>
                      <div style={{ flex: 1, marginRight: "10px" }}>
                        <Formik
                          onSubmit={async (values, { setSubmitting }) => {
                            // Submit logic for the text form
                          }}
                        >
                          <Form style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px" }}>
                            <h2>Question 3 of 3</h2>
                            <h3>Tell us about a time when you overcame a challenge</h3>
                            <p>
                              Pro tips:
                              <br />
                              <ul>
                                  <li>
                                  This is like your "highlight reel" moment. Show off!                </li>
                                  <li>Pick one specific challenge in your studies, personal life, or work/internships. Tell a story with a positive outcome and/or positive lesson learned that you can contribute to the workplace.</li>
                                  <li>Emphasize key "soft skills". Examples of soft skills include creativity, leadership, resilience, adaptability, quick decision-making, etc.</li>
                                  <li></li>
                              </ul>
                              </p>
                            <div style={{ marginBottom: "20px" }}>
                            </div>
                          </Form>
                        </Formik>
                      </div>
                      <div style={{ flex: 1, marginLeft: "10px" }}>
                        <Formik
                          initialValues={{ video3: null }}
                          onSubmit={async (values, { setSubmitting }) => {
                            if (values.video3) {
                              try {
                                if (globalVideo3Link === "") {
                                  // Upload the video and proceed to the next step only after the upload is successful
                                  await handleUpload(values.video3, 3);
                                }
                                setStep(9);
                                setSubmitting(false);
                              } catch (error) {
                                console.error("Video upload failed:", error);
                                alert('There was an issue uploading the video, please try again.');
                                setSubmitting(false);
                              }
                            } else {
                              alert('Please finish video recording to proceed and get Drafted!');
                              setSubmitting(false);
                            }
                          }}
                        >
                          {({ setFieldValue }) => (
                            <Form style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px" }}>
                              <VideoRecorder
                                key={3}
                                isOnInitially
                                timeLimit={60000}
                                showReplayControls
                                onRecordingComplete={(videoBlob) => {
                                  // Set the global video blob
                                  setFieldValue("video3", videoBlob);
                                  setVideo3Recorded(true);
                                }}
                              />
                              <div className="video-frame"></div>
                              <p className="video-info">Video Response: 1 min time limit</p>
                              <p className="video-info">Unlimited retries</p>
                              <button type="button" onClick={() => setStep(7)}>Previous</button>
                              <button
                                type="submit"
                                style={buttonStyles}
                                disabled={!isVideo3Recorded}
                              >
                                Submit
                              </button>
                            </Form>
                          )}
                        </Formik>
                      </div>
                    </div>
                  </div>
                </>
              );
      case 9:
        return (
          <>
          <Form>
          <h2>🥳</h2>
            <h2>Congratulations, your profile is complete!</h2>
            <p>
              Keep an eye on your inbox as hiring companies and recruiters begin reaching out to you. Eventually, you will
              be able to access your Drafted profile to see more information like video views, companies viewing your video
              resume, and more.
            </p>
            <p>In the meantime, check out our blog site for helpful interview tips, recommendations, and know-hows to land your next full-time job!</p>
            <a href="https://www.joindrafted.com/drafted-blog" target="_blank" rel="noopener noreferrer">
            <button type="button" onClick={() => setStep(8)}>Previous</button>
              <button 
                style={buttonStyles} 
                onClick={() => {
                  window.location.href = 'https://www.joindrafted.com/drafted-blog';
                }}
              >
                Drafted Blog
              </button>
            </a>
          </Form>

          </>
        );
      default:
        return null;
    }
  };
  

  return (
    <div>
    <h1 style={{ fontWeight: '2500', paddingLeft: '50px', marginLeft: '10px' }}>
      drafted<span style={{ color: '#53ad7a' }}> beta</span><span style={{ color: 'black' }}>.</span>
    </h1>    
    <Formik
        initialValues={initialValues}
        // validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
    {() => (
      <RenderStepContent />
    )}
    </Formik>
    </div>
  );
};

setTimeout(() => {
  const alertContainer = document.querySelector('.alert');
  if (alertContainer) {
    alertContainer.style.display = 'none';
  }
}, 3000);

export default MultiStepForm;