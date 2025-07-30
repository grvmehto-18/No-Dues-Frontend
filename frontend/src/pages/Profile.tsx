import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  Divider,
  Button,
  TextField,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  useTheme,
  alpha,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  Edit as EditIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Upload as UploadIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useForm, Controller } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";
import api from "../services/api";
import userService from "../services/userService";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";

interface ProfileUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

const dataURLtoFile = (dataurl: string, filename: string): File | null => {
  try {
    const arr = dataurl.split(",");
    if (!arr[0] || !arr[1]) {
      console.error("Invalid data URL format");
      return null;
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || mimeMatch.length < 2) {
      console.error("Could not extract MIME type from data URL");
      return null;
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (e) {
    console.error("Error converting data URL to File:", e);
    return null;
  }
};

const Profile: React.FC = () => {
  const theme = useTheme();
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [signatureSuccess, setSignatureSuccess] = useState<string | null>(null);
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [drawingSignature, setDrawingSignature] = useState(false);
  const [drawingError, setDrawingError] = useState<string | null>(null);
  const [drawingSuccess, setDrawingSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    getValues, // Added getValues
  } = useForm<ProfileUpdateRequest>({
    mode: "onChange", // Validate on change
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    if (user && user.eSignature) {
      setSignature(user.eSignature);
    } else {
      setSignature(null);
    }
  }, [user]);

  const handleEdit = () => {
    reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
    });
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    setIsEditing(false);
    reset();
    setError(null);
  };

  const onSubmit = async (data: ProfileUpdateRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const updateData: Partial<ProfileUpdateRequest> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      currentPassword: data.currentPassword, // Always send currentPassword field
    };
    if (data.newPassword) {
      updateData.newPassword = data.newPassword;
    } else {
      // Ensure empty newPassword is not sent if user didn't type one
      delete updateData.newPassword;
    }
    // Ensure currentPassword is not sent if it's empty and newPassword is also empty
    if (!data.newPassword && !data.currentPassword) {
      delete updateData.currentPassword;
    }

    try {
      await api.put("/profile", updateData);

      if (updateUser) {
        updateUser({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        });
      }

      if (data.newPassword) {
        setSuccess(
          "Profile updated successfully! Password changed. Consider logging out and back in."
        );
      } else {
        setSuccess("Profile updated successfully!");
      }

      setIsEditing(false);
    } catch (err: any) {
      console.error("Profile update failed:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateSignatureStateAndContext = (base64Data: string) => {
    setSignature(base64Data);
    if (updateUser) {
      updateUser({ eSignature: base64Data });
    }
  };

  const clearSignatureFeedback = () => {
    setSignatureError(null);
    setSignatureSuccess(null);
    setDrawingError(null);
    setDrawingSuccess(null);
  };

  const handleSignatureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearSignatureFeedback();

    if (!file.type.startsWith("image/")) {
      setSignatureError("Please upload an image file (PNG, JPG, GIF).");
      return;
    }
    const maxSizeInBytes = 1 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setSignatureError(
        `Image size must be less than ${maxSizeInBytes / 1024 / 1024}MB.`
      );
      return;
    }

    setUploadingSignature(true);

    try {
      await userService.uploadESignature(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(",")[1];
        updateSignatureStateAndContext(base64Data);
        setSignatureSuccess("Signature uploaded successfully!");
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        setSignatureError("Failed to read uploaded file for preview.");
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Error uploading signature:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Failed to upload signature. Please try again.";
      setSignatureError(errorMsg);
    } finally {
      setUploadingSignature(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleClearDrawing = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
    clearSignatureFeedback();
  };

  const handleSaveDrawing = async () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      setDrawingError("Please draw your signature first.");
      return;
    }

    clearSignatureFeedback();
    setDrawingSignature(true);

    try {
      const dataUrl = sigPadRef.current.getCanvas().toDataURL("image/png");

      if (!dataUrl) {
        throw new Error("Could not get signature data from canvas.");
      }

      const signatureFile = dataURLtoFile(
        dataUrl,
        `drawn-signature-${user?.id || Date.now()}.png`
      );
      if (!signatureFile) {
        throw new Error("Could not convert drawing to an image file.");
      }

      const maxSizeInBytes = 1 * 1024 * 1024;
      if (signatureFile.size > maxSizeInBytes) {
        setDrawingError(
          `Drawn signature is too large ( > ${
            maxSizeInBytes / 1024 / 1024
          }MB). Please draw smaller or clear and try again.`
        );
        setDrawingSignature(false);
        return;
      }

      await userService.uploadESignature(signatureFile);

      const base64Data = dataUrl.split(",")[1];
      updateSignatureStateAndContext(base64Data);
      setDrawingSuccess("Signature saved successfully!");
      sigPadRef.current?.clear();
    } catch (error: any) {
      console.error("Error saving drawn signature:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Failed to save signature. Please try again.";
      setDrawingError(errorMsg);
    } finally {
      setDrawingSignature(false);
    }
  };

  const InfoItem = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | undefined | null;
  }) => (
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      <Icon sx={{ color: theme.palette.primary.main, mr: 2 }} />
      <Box>
        <Typography variant="caption" color="text.secondary" component="div">
          {label}
        </Typography>
        <Typography variant="body1">{value || "N/A"}</Typography>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          border: `1px solid ${theme.palette.divider}`,
          backdropFilter: "blur(3px)",
        }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            mb: 4,
            gap: { xs: 2, sm: 3 },
          }}>
          <Avatar
            alt={`${user?.firstName} ${user?.lastName}`}
            sx={{
              width: { xs: 80, md: 100 },
              height: { xs: 80, md: 100 },
              bgcolor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              fontSize: { xs: "1.8rem", md: "2.5rem" },
              mr: { sm: 3 },
              mb: { xs: 2, sm: 0 },
            }}>
            {user?.firstName?.[0]?.toUpperCase()}
            {user?.lastName?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ textAlign: { xs: "center", sm: "left" }, flexGrow: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              sx={{
                mt: 1,
                justifyContent: { xs: "center", sm: "flex-start" },
              }}>
              {user?.roles?.map((role) => {
                const roleName =
                  typeof role === "string"
                    ? role
                    : role?.name || "ROLE_UNKNOWN";
                const cleanRoleName = roleName
                  .replace("ROLE_", "")
                  .replace(/_/g, " ")
                  .toUpperCase();
                return (
                  <Chip
                    key={roleName}
                    label={cleanRoleName}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                );
              })}
            </Stack>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            disabled={isEditing}
            sx={{
              mt: { xs: 2, sm: 0 },
              alignSelf: { xs: "center", sm: "flex-start" },
            }}>
            Edit Profile
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={{ xs: 2, md: 4 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600 }}>
              Personal Information
            </Typography>
            <InfoItem
              icon={PersonIcon}
              label="Username"
              value={user?.username}
            />
            <InfoItem icon={EmailIcon} label="Email" value={user?.email} />
            <InfoItem
              icon={BadgeIcon}
              label="Unique Code"
              value={user?.uniqueCode}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600 }}>
              Department Information
            </Typography>
            <InfoItem
              icon={SchoolIcon}
              label="Department"
              value={user?.department}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
          E-Signature Management
        </Typography>

        <Box sx={{ mb: 3 }}>
          {signatureSuccess && (
            <Alert severity="success" onClose={() => setSignatureSuccess(null)}>
              {signatureSuccess}
            </Alert>
          )}
          {drawingSuccess && (
            <Alert severity="success" onClose={() => setDrawingSuccess(null)}>
              {drawingSuccess}
            </Alert>
          )}
          {signatureError && (
            <Alert severity="error" onClose={() => setSignatureError(null)}>
              {signatureError}
            </Alert>
          )}
          {drawingError && (
            <Alert severity="error" onClose={() => setDrawingError(null)}>
              {drawingError}
            </Alert>
          )}
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom>
                  Current Signature & Upload New
                </Typography>

                <Box
                  sx={{
                    height: 180,
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                    p: 1,
                    backgroundColor: theme.palette.background.default,
                    position: "relative",
                  }}>
                  {uploadingSignature && (
                    <CircularProgress
                      size={40}
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        marginTop: "-20px",
                        marginLeft: "-20px",
                        zIndex: 1,
                      }}
                    />
                  )}
                  {signature ? (
                    <img
                      src={`data:image/png;base64,${signature}`}
                      alt="Your E-Signature"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No signature set. Upload or draw one.
                    </Typography>
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  Upload a clear image (PNG, JPG, GIF) of your signature. Max
                  file size: 1MB.
                </Typography>
              </CardContent>
              <CardActions
                sx={{
                  justifyContent: "flex-start",
                  p: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}>
                <Button
                  component="label"
                  variant="contained"
                  color="primary"
                  startIcon={<UploadIcon />}
                  disabled={uploadingSignature || drawingSignature}>
                  {signature ? "Replace via Upload" : "Upload Signature"}
                  <input
                    type="file"
                    hidden
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleSignatureUpload}
                  />
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom>
                  Draw New Signature
                </Typography>

                <Box
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    position: "relative",
                    mb: 2,
                    height: 180,
                    cursor: "crosshair",
                    backgroundColor: "#fff",
                    overflow: "hidden",
                  }}>
                  <SignatureCanvas
                    ref={sigPadRef}
                    penColor="black"
                    canvasProps={{
                      style: {
                        width: "100%",
                        height: "100%",
                        display: "block",
                      },
                      className: "signature-canvas",
                    }}
                    onBegin={() => {
                      clearSignatureFeedback();
                    }}
                  />
                  {drawingSignature && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: alpha(theme.palette.common.white, 0.7),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 1,
                        zIndex: 1,
                      }}>
                      <CircularProgress size={40} />
                    </Box>
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  Use your mouse or touchscreen to draw in the box above. Clear
                  if needed.
                </Typography>
              </CardContent>
              <CardActions
                sx={{
                  justifyContent: "space-between",
                  p: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}>
                <Button
                  onClick={handleClearDrawing}
                  startIcon={<ClearIcon />}
                  disabled={drawingSignature || uploadingSignature}
                  color="secondary">
                  Clear Drawing
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveDrawing}
                  startIcon={<SaveIcon />}
                  disabled={drawingSignature || uploadingSignature}>
                  Save Drawing
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        <Grid container sx={{ mt: 4 }}>
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom>
                  Using Your E-Signature
                </Typography>
                <Typography variant="body2" paragraph>
                  Your saved e-signature will be automatically applied when
                  required for actions like approving documents, generating
                  receipts, or issuing certificates within the system.
                </Typography>
                <Typography variant="body2" paragraph>
                  Please ensure your signature (whether uploaded or drawn) is
                  clear and accurately represents your standard signature for
                  legal validity where applicable.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog
          open={isEditing}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          aria-labelledby="edit-profile-dialog-title"
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.background.paper, 0.98),
              backdropFilter: "blur(5px)",
            },
          }}>
          <DialogTitle
            id="edit-profile-dialog-title"
            sx={{ pb: 1, fontWeight: "bold" }}>
            Edit Your Profile
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogContent dividers>
              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {/* Show success message differently based on password change */}
              {success && !getValues("newPassword") && (
                <Alert
                  severity="success"
                  sx={{ mb: 2 }}
                  onClose={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}
              {success && getValues("newPassword") && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="firstName"
                    control={control}
                    rules={{ required: "First name is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="First Name"
                        fullWidth
                        variant="outlined"
                        required
                        error={!!errors.firstName}
                        helperText={errors.firstName?.message}
                        autoComplete="given-name"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="lastName"
                    control={control}
                    rules={{ required: "Last name is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Last Name"
                        fullWidth
                        variant="outlined"
                        required
                        error={!!errors.lastName}
                        helperText={errors.lastName?.message}
                        autoComplete="family-name"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address format",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="outlined"
                        required
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        autoComplete="email"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1, mt: 2 }}>
                    Update Password (Optional)
                  </Typography>
                  <Divider />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="currentPassword"
                    control={control}
                    rules={{
                      validate: (value, formValues) => {
                        if (formValues.newPassword && !value) {
                          return "Current password is required to set a new one";
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="password"
                        label="Current Password"
                        fullWidth
                        variant="outlined"
                        error={!!errors.currentPassword}
                        helperText={
                          errors.currentPassword?.message ||
                          "Enter only if setting a new password."
                        }
                        autoComplete="current-password"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="newPassword"
                    control={control}
                    rules={{
                      validate: (value, formValues) => {
                        // Rule 1: If newPassword has a value, it must be >= 6 chars
                        if (value && value.length < 6) {
                          return "Password must be at least 6 characters";
                        }
                        // Rule 2: If newPassword has a value, currentPassword must also have a value
                        if (value && !formValues.currentPassword) {
                          return "Please enter your current password as well";
                        }
                        // Rule 3: Ensure new password is not the same as current password (Optional but good practice)
                        // if (value && value === formValues.currentPassword) {
                        //   return "New password cannot be the same as the current password";
                        // }
                        return true; // Pass validation
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="password"
                        label="New Password"
                        fullWidth
                        variant="outlined"
                        error={!!errors.newPassword}
                        helperText={
                          errors.newPassword?.message ||
                          "Leave blank to keep your current password (min 6 chars)."
                        }
                        autoComplete="new-password"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 2 }}>
              <Button
                onClick={handleClose}
                disabled={loading}
                color="secondary">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default Profile;
