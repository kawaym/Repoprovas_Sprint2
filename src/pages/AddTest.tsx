import {
  Divider,
  Typography,
  Box,
  Button,
  TextField,
  Autocomplete,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { AxiosError } from "axios";

import React, { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import useAlert from "../hooks/useAlert";
import api, {
  Category,
  Discipline,
  Teacher,
  TestCreationData,
} from "../services/api";

function AddTest() {
  const { setMessage } = useAlert();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState<boolean>(true);

  const [formTestData, setFormTestData] = useState<TestCreationData>({
    name: "",
    pdfUrl: "",
    categoryId: 0,
    disciplineId: 0,
    teacherId: 0,
  });

  const { token } = useAuth();

  useEffect(() => {
    async function loadPage() {
      if (!token) return;

      const { data: categoriesData } = await api.getCategories(token);
      setCategories(categoriesData.categories);
      const { data: disciplinesData } = await api.getDisciplines(token);
      setDisciplines(disciplinesData.disciplines);
    }
    loadPage();
  }, [token]);

  async function handleUpdateTeachers(chosenDiscipline: Discipline | null) {
    setIsLoadingTeachers(true);
    if (!token) return;
    if (!chosenDiscipline || !chosenDiscipline.id) return;
    const { data: teachersData } = await api.getTeachersByDiscipline(
      token,
      chosenDiscipline.id
    );
    setFormTestData({ ...formTestData, disciplineId: chosenDiscipline.id });
    setTeachers(teachersData.teachers);
    setIsLoadingTeachers(false);
    setSelectedTeacher(null);
  }

  async function handleSubmit() {
    setMessage(null);

    console.log(JSON.stringify(formTestData, null, 2));

    if (
      !(
        formTestData?.name &&
        formTestData?.pdfUrl &&
        formTestData?.categoryId &&
        formTestData?.teacherId &&
        formTestData?.disciplineId
      )
    ) {
      setMessage({ type: "error", text: "Todos os campos são obrigatórios!" });
      return;
    }
    try {
      if (!token) return;
      await api.createTest(token, formTestData);
      setMessage({ type: "success", text: "Cadastro efetuado com sucesso!" });
      navigate("/app/disciplinas");
    } catch (error: Error | AxiosError | any) {
      if (error.response) {
        setMessage({
          type: "error",
          text: error.response.data,
        });
        return;
      }
      setMessage({
        type: "error",
        text: "Erro, tente novamente em alguns segundos!",
      });
    }
  }
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormTestData({ ...formTestData, [e.target.name]: e.target.value });
  }

  return (
    <>
      <Typography
        sx={{
          marginX: "auto",
          marginBottom: "35px",
          fontFamily: "Roboto",
          fontSize: "24px",
        }}
      >
        Adicione uma prova
      </Typography>
      <Divider sx={{ marginBottom: "35px" }} />
      <Box
        sx={{
          marginX: "auto",
          width: "700px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/app/disciplinas")}
          >
            Disciplinas
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/app/pessoas-instrutoras")}
          >
            Pessoa Instrutora
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/app/adicionar")}
          >
            Adicionar
          </Button>
        </Box>
        <TextField
          name="name"
          sx={{ marginX: "auto", marginTop: "25px", width: "100%" }}
          label="Título da Prova"
          value={formTestData.name}
          onChange={handleInputChange}
        />
        <TextField
          name="pdfUrl"
          sx={{ marginX: "auto", marginTop: "25px", width: "100%" }}
          label="URL da Prova"
          value={formTestData.pdfUrl}
          onChange={handleInputChange}
        />
        <Autocomplete
          disablePortal
          options={categories}
          getOptionLabel={(option) => option.name ?? option}
          onChange={(e, v, r) => {
            if (v) setFormTestData({ ...formTestData, categoryId: v.id });
          }}
          sx={{ marginTop: "25px", width: "100%" }}
          renderInput={(params) => <TextField {...params} label="Categoria" />}
        />
        <Autocomplete
          disablePortal
          options={disciplines}
          onChange={(_, value, r) => {
            handleUpdateTeachers(value);
            if (r === "clear") setSelectedTeacher(null);
          }}
          getOptionLabel={(option) => option.name ?? option}
          sx={{ marginTop: "25px", width: "100%" }}
          renderInput={(params) => <TextField {...params} label="Disciplina" />}
        />
        <Autocomplete
          disablePortal
          disabled={isLoadingTeachers}
          options={teachers}
          onChange={(e, v, r) => {
            setSelectedTeacher(v);
            if (v) setFormTestData({ ...formTestData, teacherId: v.id });
          }}
          getOptionLabel={(option) => option.name ?? option}
          sx={{ marginTop: "25px", width: "100%" }}
          renderInput={(params) => (
            <TextField {...params} label="Pessoa Instrutora" />
          )}
          value={selectedTeacher}
        />
        <Button
          variant="contained"
          sx={{
            height: "50px",
            width: "100%",
            marginTop: "25px",
            marginBottom: "50px",
          }}
          onClick={() => handleSubmit()}
        >
          Enviar
        </Button>
      </Box>
    </>
  );
}

export default AddTest;
